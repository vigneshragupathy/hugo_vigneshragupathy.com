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

The request is rejected because no valid JWT was provided.

---

## ✅ Step 7: Test With JWT

Now include the JWT in your header:

```bash
kubectl exec deploy/frontend -- curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" http://backend
```

✅ Expected:

```bash
200
```

🎉 Success! The request passed Istio’s JWT validation layer.

---

## 🧠 Step 8: Add Claim-Based Rules (Optional)

Let’s say you only want users with a specific email to access the backend.

Add this advanced rule:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: backend-jwt-claims
  namespace: default
spec:
  selector:
    matchLabels:
      app: backend
  action: ALLOW
  rules:
  - when:
    - key: request.auth.claims[email]
      values: ["test@secure.istio.io"]
EOF
```

Now even valid JWTs will be blocked unless they include the correct claim.

---

## 🧾 Step 9: Validate Behavior Summary


| Scenario                  | JWT  | Expected | Status   |
| --------------------------- | ------ | ---------- | ---------- |
| No JWT                    | ❌   | 403      | Rejected |
| Invalid JWT               | ❌   | 403      | Rejected |
| Valid JWT (wrong claim)   | ⚠️ | 403      | Rejected |
| Valid JWT (correct claim) | ✅   | 200      | Allowed  |

---

## 🧩 Step 10: Clean Up (Optional)

Remove the policies if needed:

```bash
kubectl delete requestauthentication backend-jwt
kubectl delete authorizationpolicy backend-jwt-policy backend-jwt-claims
```

---

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
