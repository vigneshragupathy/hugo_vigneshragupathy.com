---
#layout: post
title: Istio Hands-on Part 4 - Traffic Management with VirtualService and DestinationRule
date: '2025-11-09 00:50:00'
tags:
- kubernetes
- observability
author: Vignesh Ragupathy
comments: true
ShowToc: false
cover:
    image: ../../images/2025/istio_part4_cover.webp
    alt: Istio Part4 Cover
    hiddenInSingle: true
---
[⬅ Back to Intro](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) | [Next → Part 5 - Observability with Prometheus, Grafana, and Kiali](../istio-hands-on-part-5-observability-with-prometheus-grafana-and-kiali)

### Objective

In this post, we’ll learn how to use **Istio’s traffic management features** — specifically:

- `VirtualService` (to define *how* traffic is routed)
- `DestinationRule` (to define *where* traffic is routed)

By the end, you’ll:

- Deploy two versions of your backend service
- Split traffic between them
- Perform canary-style rollouts
- Simulate faults and retries

![Istio Part 4](../../images/2025/istio_part4_cover.webp)
---

## Step 1: Recap – Your Current Setup

You should already have:

- A **frontend** deployment that sends requests to `backend`
- Istio **sidecar injection** enabled
- `frontend → backend` communication working

We’ll extend that setup to include a **second backend version** (`v2`).

---

## Step 2: Deploy Backend v1 and v2

Let’s modify the existing backend deployment to include two versions.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-v1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
      version: v1
  template:
    metadata:
      labels:
        app: backend
        version: v1
    spec:
      containers:
      - name: backend
        image: hashicorp/http-echo
        args: ["-text=Hello from Backend v1"]
        ports:
        - containerPort: 5678
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
      version: v2
  template:
    metadata:
      labels:
        app: backend
        version: v2
    spec:
      containers:
      - name: backend
        image: hashicorp/http-echo
        args: ["-text=Hello from Backend v2"]
        ports:
        - containerPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 5678
EOF
```

Verify:

```bash
kubectl get pods -l app=backend
```

✅ You should see both versions running:

```bash
backend-v1-xxxxx   2/2   Running
backend-v2-xxxxx   2/2   Running
```

---

## Step 3: Add a DestinationRule

A **DestinationRule** defines *subsets* — logical groups of service versions (based on labels) that you can route traffic to.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: backend
spec:
  host: backend
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
EOF
```

Check:

```bash
kubectl get destinationrule
```

✅ Output:

```bash
NAME      HOST      AGE
backend   backend   9s
```

---

## Step 4: Create a VirtualService

Now, let’s control how requests are routed between `v1` and `v2`.

We’ll start with **100% traffic to v1** .

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: backend
spec:
  hosts:
  - backend
  http:
  - route:
    - destination:
        host: backend
        subset: v1
      weight: 100
    - destination:
        host: backend
        subset: v2
      weight: 0
EOF
```

---

## Step 5: Test Traffic Routing

Run:

```bash
kubectl exec deploy/frontend -- curl -s http://backend
```

✅ You should see:

```bash
Hello from Backend v1
```

Now let’s gradually shift some traffic to v2.

---

## Step 6: Split Traffic 80/20 Between v1 and v2

Update your VirtualService:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: backend
spec:
  hosts:
  - backend
  http:
  - route:
    - destination:
        host: backend
        subset: v1
      weight: 80
    - destination:
        host: backend
        subset: v2
      weight: 20
EOF
```

Run several requests:

```bash
for i in {1..10}; do kubectl exec deploy/frontend -- curl -s http://backend; done
```

✅ Output (mixed):

```bash
Hello from Backend v2
Hello from Backend v2
Hello from Backend v1
Hello from Backend v1
Hello from Backend v1
...
```

Congratulations 🎉 — you’ve just performed a **canary release** in Istio!

---

## Step 7: Fault Injection (Simulating Latency)

Let’s simulate a slow backend to see how Istio handles delays.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: backend
spec:
  hosts:
  - backend
  http:
  - fault:
      delay:
        percentage:
          value: 50
        fixedDelay: 3s
    route:
    - destination:
        host: backend
        subset: v1
      weight: 100
EOF
```

Now test again:

```bash
for i in {1..5}; do kubectl exec deploy/frontend -- time curl -s http://backend; done
```

✅ You’ll notice roughly half the requests are delayed by ~3 seconds.

```bash
Hello from Backend v1
real	0m 3.01s
user	0m 0.00s
sys	0m 0.00s
Hello from Backend v1
real	0m 0.01s
user	0m 0.00s
sys	0m 0.00s
Hello from Backend v1
real	0m 0.00s
user	0m 0.00s
sys	0m 0.00s
Hello from Backend v1
real	0m 3.02s
user	0m 0.00s
sys	0m 0.00s
Hello from Backend v1
real	0m 0.01s
user	0m 0.00s
sys	0m 0.00s
```

Remove the fault rule:

```bash
kubectl delete virtualservice backend
```

---

## Step 8: Add Retry Logic

Let’s add a retry policy so the frontend automatically retries failed calls.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: backend
spec:
  hosts:
  - backend
  http:
  - retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: gateway-error,connect-failure,refused-stream
    route:
    - destination:
        host: backend
        subset: v1
EOF
```

This tells Istio to retry up to 3 times if a connection fails.

---

## Step 9: Summary

You just learned how to **control and manipulate traffic** using Istio’s most powerful features:


| Feature               | Resource                             | Description                               |
| ----------------------- | -------------------------------------- | ------------------------------------------- |
| **Traffic splitting** | `VirtualService` + `DestinationRule` | Gradually route traffic between versions  |
| **Fault injection**   | `VirtualService`                     | Test failures or latency                  |
| **Retries**           | `VirtualService`                     | Improve reliability on transient failures |

You now have fine-grained control over **how** traffic flows between services — without changing any application code.

---

### 🧵 Next Up

[👉 **Istio Hands-on Part 5 – Observability with Prometheus, Grafana, and Kiali**](../istio-hands-on-part-5-observability-with-prometheus-grafana-and-kiali)

We’ll explore metrics, traces, and service graphs to understand what’s happening inside your mesh.

[⬅ Back to Intro](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) | [Next → Part 5 - Observability with Prometheus, Grafana, and Kiali](../istio-hands-on-part-5-observability-with-prometheus-grafana-and-kiali)
