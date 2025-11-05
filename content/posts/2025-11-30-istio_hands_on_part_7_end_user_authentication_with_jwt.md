---
#layout: post
title: Istio Hands-on Part 7 - End-User Authentication with JWT
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
### 🎯 Objective

In the previous part, we secured service-to-service communication using mTLS and AuthorizationPolicies.

In this post, we’ll:

- Introduce **end-user authentication** with **JWT tokens**
- Configure **RequestAuthentication** and **AuthorizationPolicy**
- Enforce identity validation on your services

By the end, your backend service will accept requests **only from clients presenting valid JWTs**.

---

## 🧩 Step 1: Prerequisites

You should already have:

- A running **frontend ↔ backend** setup from Part 6
- Istio sidecars running
- mTLS in `STRICT` mode
- `backend` protected with an `AuthorizationPolicy`

Let’s now add **user identity** on top of workload identity.

---

## 🔑 Step 2: Understanding JWT in Istio

JWT (**JSON Web Token**) is a signed token that contains user identity information (claims).Istio can:

- Validate the JWT signature
- Verify claims like `iss` (issuer) and `aud` (audience)
- Extract claims into request headers for app use

Typical flow:

Client → (JWT) → Istio Ingress Gateway → Backend Service

Istio validates the JWT **before** the request reaches your app.

## ⚙️ Step 3: Prepare a Sample JWT Token

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

## 🧱 Step 4: Apply a RequestAuthentication Policy

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

## 🚦 Step 5: Add Authorization Based on Valid JWT

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

## 🧪 Step 6: Test Without JWT

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


## 🧠 Why the Internal (Sidecar-to-Sidecar) Approach Doesn’t Work Anymore

In earlier Istio versions, you could apply `RequestAuthentication` and `AuthorizationPolicy` directly to workloads (like `app=backend`), and the **sidecar** would validate JWTs even for internal traffic.

However, since **Istio 1.27+** , the architecture changed:

* **JWT validation filters are only attached** to Envoy listeners that face **external or non-mTLS traffic** .
* Internal mesh traffic (mTLS) bypasses JWT filters for performance optimization.
* This means JWT validation **doesn’t trigger** for in-mesh requests (e.g., frontend → backend), hence always returns `200`.

✅ The right way now is to:

* Enforce JWT at **IngressGateway** (external entry point)
* Optionally propagate verified identity downstream using `RequestPrincipal` or SPIFFE IDs.

This is by design — JWTs are meant to protect **entry into the mesh** , not **in-mesh mTLS-authenticated** calls.



## 🧱 Step 2: Create an Ingress Gateway and Route to Backend

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
    - "*"
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: backend-vs
  namespace: default
spec:
  hosts:
  - "*"
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

---

## ⚙️ Step 3: Deploy JWT Policies on the Ingress Gateway

We’ll apply both the **RequestAuthentication** (defines valid JWT issuers)

and the **AuthorizationPolicy** (enforces access rules).

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
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: ingress-jwt-policy
  namespace: istio-system
spec:
  selector:
    matchLabels:
      istio: ingressgateway
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["testing@secure.istio.io/*"]
EOF
```

---

## 🌐 Step 4: Access via Kind Cluster (Ingress Setup)

If you’re running this lab on a **kind** cluster, the `LoadBalancer` service won’t have a public IP.

We can use the **NodePort + Docker IP** method to test it.

Find the HTTP port used by the IngressGateway:

```bash
export INGRESS_PORT=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.spec.ports[?(@.port==80)].nodePort}')
```

Then find the kind node IP (inside Docker):

```bash
export INGRESS_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' istio-lab-control-plane)
```

Combine them:

<pre class="overflow-visible!" data-start="3936" data-end="4034"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span><span class="hljs-built_in">export</span></span><span> GATEWAY_URL=</span><span><span class="hljs-variable">$INGRESS_HOST</span></span><span>:</span><span><span class="hljs-variable">$INGRESS_PORT</span></span><span>
</span><span><span class="hljs-built_in">echo</span></span><span> </span><span><span class="hljs-string">"Gateway URL: http://<span class="hljs-variable">$GATEWAY_URL</span></span></span><span>"
</span></span></code></div></div></pre>

✅ Test your backend service through the gateway:

```bash
curl -v http://$INGRESS_HOST:$INGRESS_PORT/
```

❌ Without token → Expect: **403 Forbidden**

✅ With token → Expect: **200 OK**

<pre class="overflow-visible!" data-start="4208" data-end="4282"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>curl -v -H </span><span><span class="hljs-string">"Authorization: Bearer <span class="hljs-variable">$TOKEN</span></span></span><span>" http://</span><span><span class="hljs-variable">$GATEWAY_URL</span></span><span>/
</span></span></code></div></div></pre>

---

##

## 🧠 Summary

In this post, you:

* Introduced **end-user identity** to your mesh
* Validated tokens using **RequestAuthentication**
* Enforced access using **AuthorizationPolicy**
* Combined mTLS (workload identity) with JWT (user identity)

Now your services are **zero-trust at both levels** :

* **Workload-to-workload** : verified via mTLS & SPIFFE
* **User-to-service** : verified via JWT & claims

---

### 🧵 Next Up

👉 **Istio Hands-on Part 8 – Ingress Gateway and External Traffic**

We’ll expose the mesh to the outside world securely, combining Gateway + VirtualService + JWT auth for external APIs.
