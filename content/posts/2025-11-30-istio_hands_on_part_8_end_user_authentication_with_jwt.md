---
#layout: post
title: Istio Hands-on Part 8 - End-User Authentication with JWT
date: '2026-11-01 00:50:00'
tags:
- kubernetes
- observability
author: Vignesh Ragupathy
comments: true
ShowToc: false
cover:
    image: ../../images/2025/istio_part1_cover.webp
    alt: Istio Part1 Cover
    hiddenInSingle: true
---
[⬅ Back to Intro](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) | [Next → Part 9 - Ingress Gateway](../istio-hands-on-part-9-exposing-services-securely-with-ingress-gateway/)

> 💡 *This post is part of my [Istio Hands-on Series](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) — a practical journey into Kubernetes Service Mesh. Each post builds on the previous one with hands-on labs, real command outputs, and clear explanations aimed at learning Istio by doing, not just reading.*

### Objective

In the previous part, we secured service-to-service communication using mTLS and AuthorizationPolicies.

In this post, we’ll:

- Introduce **end-user authentication** with **JWT tokens**
- Configure **RequestAuthentication** and **AuthorizationPolicy**
- Enforce identity validation on your services

By the end, your backend service will accept requests **only from clients presenting valid JWTs**.

---

### Step 1: Prerequisites

You should already have:

- A running **frontend ↔ backend** setup from Part 6
- Istio sidecars running
- mTLS in `STRICT` mode
- `backend` protected with an `AuthorizationPolicy`

Let’s now add **user identity** on top of workload identity.

---

### Step 2: Understanding JWT in Istio

JWT (**JSON Web Token**) is a signed token that contains user identity information (claims).Istio can:

- Validate the JWT signature
- Verify claims like `iss` (issuer) and `aud` (audience)
- Extract claims into request headers for app use

Typical flow:

Client → (JWT) → Istio Ingress Gateway → Backend Service

Istio validates the JWT **before** the request reaches your app.

### Step 3: Prepare a Sample JWT Token

We’ll use a public demo JWT from Istio’s examples, signed by Google’s public key set.

Test token (shortened for readability):

```bash
 TOKEN=$(curl -s https://raw.githubusercontent.com/istio/istio/release-1.27/security/tools/jwt/samples/demo.jwt)
echo $TOKEN
```

You can inspect its claims:

```bash
echo $TOKEN | cut -d "." -f2 | base64 -d 2>/dev/null | jq .
```

Example output:

```json
{
  "exp": 4685989700,
  "foo": "bar",
  "iat": 1532389700,
  "iss": "testing@secure.istio.io",
  "sub": "testing@secure.istio.io"
}
```

---

### Step 4: Apply a RequestAuthentication Policy

This tells Istio:

* Which issuer (`iss`) is trusted
* Where to fetch public keys (`jwksUri`)
* Which workloads should validate tokens

```bash
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1
kind: RequestAuthentication
metadata:
  name: backend-jwt
  namespace: default
spec:
  selector:
    matchLabels:
      app: backend
  jwtRules:
  - issuer: "testing@secure.istio.io"
    jwksUri: "https://raw.githubusercontent.com/istio/istio/release-1.27/security/tools/jwt/samples/jwks.json"
EOF

```

✅ This allows Istio to validate tokens signed by the `testing@secure.istio.io` issuer.

---

### Step 5: Add Authorization Based on Valid JWT

Now, enforce that only **authenticated users with valid JWTs** can access the backend.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: backend-jwt-policy
  namespace: default
spec:
  selector:
    matchLabels:
      app: backend
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["testing@secure.istio.io/*"]
EOF
```

This means:

> Allow only requests carrying a valid JWT issued by `testing@secure.istio.io`.

---

### Step 6: Test Without JWT

From the frontend or curl pod:

```bash
kubectl exec deploy/frontend -- curl -s -o /dev/null -w "%{http_code}\n" http://backend
```

❌ Expected:

```bash
403
```

But actual

```bash
200
```

---


### Why the Internal (Sidecar-to-Sidecar) Approach Doesn’t Work Anymore

In earlier Istio versions, you could apply `RequestAuthentication` and `AuthorizationPolicy` directly to workloads (like `app=backend`), and the **sidecar** would validate JWTs even for internal traffic.

However, since **Istio 1.27+** , the architecture changed:

* **JWT validation filters are only attached** to Envoy listeners that face **external or non-mTLS traffic** .
* Internal mesh traffic (mTLS) bypasses JWT filters for performance optimization.
* This means JWT validation **doesn’t trigger** for in-mesh requests (e.g., frontend → backend), hence always returns `200`.

✅ The right way now is to:

* Enforce JWT at **IngressGateway** (external entry point)
* Optionally propagate verified identity downstream using `RequestPrincipal` or SPIFFE IDs.

This is by design — JWTs are meant to protect **entry into the mesh** , not **in-mesh mTLS-authenticated** calls.



### Step 2: Create an Ingress Gateway and Route to Backend

We’ll expose our **backend service** through Istio’s **Ingress Gateway** so that we can apply authentication policies at the entry point.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: backend-gateway
  namespace: default
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "backend.local"
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: backend-vs
  namespace: default
spec:
  hosts:
  - "backend.local"
  gateways:
  - backend-gateway
  http:
  - route:
    - destination:
        host: backend
        port:
          number: 80
EOF
```

> ⚠️ **Important Note**: We use `backend.local` as the hostname instead of `*` to avoid conflicts with other gateways that might have HTTPS redirects configured.

Add `backend.local` to your `/etc/hosts`:

```bash
export INGRESS_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' istio-lab-control-plane)
echo "$INGRESS_HOST backend.local" | sudo tee -a /etc/hosts
```

---

### Step 3: Deploy JWT Policies on the Ingress Gateway

We'll apply the **RequestAuthentication** (defines valid JWT issuers) on the ingress gateway:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1
kind: RequestAuthentication
metadata:
  name: ingress-jwt
  namespace: istio-system
spec:
  selector:
    matchLabels:
      istio: ingressgateway
  jwtRules:
  - issuer: "testing@secure.istio.io"
    jwksUri: "https://raw.githubusercontent.com/istio/istio/release-1.27/security/tools/jwt/samples/jwks.json"
EOF
```

Now, update the **backend's AuthorizationPolicy** to allow both internal mesh traffic and external JWT-authenticated traffic:

> ⚠️ **Important**: If you already have a `backend-allow-frontend` policy from previous tutorials, we need to update it to also allow ingress gateway traffic with valid JWT.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: backend-allow-frontend
  namespace: default
spec:
  selector:
    matchLabels:
      app: backend
  action: ALLOW
  rules:
  # Allow from frontend service account (internal mesh traffic)
  - from:
    - source:
        principals:
        - cluster.local/ns/default/sa/frontend-sa
  # Allow from ingress with valid JWT
  - from:
    - source:
        principals:
        - cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account
    - source:
        requestPrincipals:
        - testing@secure.istio.io/*
EOF
```

**Why this works:**
- Multiple rules in a single AuthorizationPolicy are joined with **OR** logic

**Why this works:**
- Multiple rules in a single AuthorizationPolicy are joined with **OR** logic
- Rule 1: Allows internal traffic from `frontend-sa` (for mesh communication)
- Rule 2: Allows traffic from ingress gateway **OR** with valid JWT (for external access)


### Step 4: Test JWT Authentication

Set up the environment variables:

```bash
export INGRESS_PORT=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.spec.ports[?(@.port==80)].nodePort}')
export INGRESS_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' istio-lab-control-plane)
export TOKEN=$(curl -s https://raw.githubusercontent.com/istio/istio/release-1.27/security/tools/jwt/samples/demo.jwt)
```

#### Test WITHOUT JWT (should get 403):

```bash
curl -v http://backend.local:$INGRESS_PORT/
```

❌ Expected output:

```
HTTP/1.1 403 Forbidden
RBAC: access denied
```

#### Test WITH JWT (should get 200):

```bash
curl -H "Authorization: Bearer $TOKEN" http://backend.local:$INGRESS_PORT/
```

✅ Expected output:

```
HTTP/1.1 200 OK
Hello from Backend v1
```

#### Test internal mesh traffic (should work without JWT):

```bash
kubectl run test-internal --rm -i --restart=Never --image=curlimages/curl --overrides='
{
  "spec": {
    "serviceAccountName": "frontend-sa",
    "containers": [{
      "name": "test-internal",
      "image": "curlimages/curl",
      "command": ["curl", "-s", "http://backend"]
    }]
  }
}'
```

✅ Expected output:

```
Hello from Backend v1
pod "test-internal" deleted
```



---

### Troubleshooting

#### Issue: Getting 301 Redirect Instead of 403

**Symptom**: When testing without JWT, you get `HTTP/1.1 301 Moved Permanently` instead of `403 Forbidden`.

**Cause**: You have multiple gateways using `host: "*"` on port 80, and one has HTTPS redirect enabled.

**Solution**: Use specific hostnames for each gateway (e.g., `backend.local`, `frontend.local`) instead of wildcards.

#### Issue: Getting 403 Even With Valid JWT

**Symptom**: Requests with valid JWT tokens are rejected with `RBAC: access denied`.

**Possible Causes**:

1. **Multiple AuthorizationPolicies with ALLOW action**: When multiple ALLOW policies target the same workload, ALL conditions must be met (AND logic).
   
   **Solution**: Consolidate policies into a single AuthorizationPolicy with multiple rules (rules are joined with OR).

2. **Duplicate RequestAuthentication policies**: Having RequestAuthentication on both ingress gateway and backend service.
   
   **Solution**: Apply RequestAuthentication only at the ingress gateway level for external traffic.

3. **Missing service account principal**: The ingress gateway service account is not allowed in the authorization policy.
   
   **Solution**: Ensure the policy includes `cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account`.

---

### Summary

In this post, you:

* Introduced **end-user identity** to your mesh
* Validated tokens using **RequestAuthentication** at the ingress gateway
* Enforced access using **AuthorizationPolicy** with multiple rules
* Combined mTLS (workload identity) with JWT (user identity)
* Learned to troubleshoot common JWT authentication issues


---

### Next Up

👉 **Istio Hands-on Part 8 – Ingress Gateway and External Traffic**

We’ll expose the mesh to the outside world securely, combining Gateway + VirtualService + JWT auth for external APIs.

[⬅ Back to Intro](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) | [Next → Part 9 - Ingress Gateway](../istio-hands-on-part-9-exposing-services-securely-with-ingress-gateway/)
