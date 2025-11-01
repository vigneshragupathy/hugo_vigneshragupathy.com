---
#layout: post
title: Istio Hands-on Part 3 - Understanding Sidecar Injection and Traffic Flow
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

In this post, we’ll explore the **core of Istio’s data plane** — the **Envoy sidecar**.

By the end, you’ll learn:

- What **sidecar injection** means
- How to verify sidecars are correctly attached
- How traffic flows through Envoy proxies
- How to inspect and troubleshoot sidecar configuration

---

## 🧱 Step 1: What Is a Sidecar?

A **sidecar proxy** is a lightweight Envoy container automatically added to every application pod in a mesh-enabled namespace.

It:

- Intercepts all inbound and outbound traffic
- Applies Istio’s routing, retry, and fault-injection policies
- Enforces **mTLS** for secure communication
- Collects metrics, logs, and traces

Together, all sidecars form Istio’s **data plane**, while `istiod` (the control plane) distributes configuration to them.

---

## ⚙️ Step 2: Verify Sidecar Injection

List your pods:

```bash
kubectl get pods
```

Pick one, for example `backend-xxxxxx`, and describe it:

```bash
kubectl describe pod backend-xxxxxx
```

You should see annotations like:

```bash
Annotations:
  istio.io/rev: default
  sidecar.istio.io/status: {"initContainers":["istio-init","istio-proxy"], ...}
```

✅ That confirms the sidecar injector webhook has modified the pod spec to include Istio containers.

To list all containers (including init containers) for a quick check:

```bash
kubectl get pods -o jsonpath='{.items[*].spec.initContainers[*].name} {.items[*].spec.containers[*].name}' | tr ' ' '\n' | sort | uniq -c
```

Expected output:

```bash
1 backend
1 frontend
2 istio-init
2 istio-proxy
```

---

## 🧠 Step 3: Inspect the Sidecar Containers

Run:

```bash
kubectl get pod backend-xxxxxx -o yaml | grep -A3  "env:"
```

You’ll find the Envoy container with arguments such as:

```bash
    env:
    - name: MODE
      value: sidecar
    image: docker.io/istio/proxyv2:1.27.3
--
    env:
    - name: PILOT_CERT_PROVIDER
      value: istiod
    - name: CA_ADDR
```

The `MODE: sidecar` environment variable confirms this pod is running in classic sidecar mode.

---

## 🧭 Step 4: Understand Traffic Flow

Let’s visualize what happens when the frontend calls the backend:

```css
[frontend app] ⇄ [Envoy sidecar] ⇄ [Envoy sidecar] ⇄ [backend app]
```

1. **Outbound traffic** from `frontend` is intercepted by its sidecar (port 15001).
2. Envoy forwards the request to the backend’s sidecar.
3. **Inbound traffic** is validated and decrypted (mTLS) by the backend’s sidecar.
4. Finally, the backend container receives the request.

To confirm mTLS is active:

```bash
kubectl get pod backend-xxxxxx -o jsonpath='{.metadata.labels.security\.istio\.io/tlsMode}'
```

Expected:

```bash
istio
```

---

## 🧰 Step 5: Explore Sidecar Configuration

You can inspect Envoy configuration for any pod using `istioctl`:

```bash
istioctl proxy-config routes backend-xxxxxx
```

Shows how requests are routed.

To view listeners:

```bash
istioctl proxy-config listeners backend-xxxxxx
```

To check all connected proxies:

```bash
istioctl proxy-status
```

You should see both `frontend` and `backend` pods as `SYNCED`.

---

## 🔍 Step 6: Check Envoy Access Logs

Envoy logs every request that passes through it.

Try:

```bash
kubectl logs deploy/frontend -c istio-proxy --tail=10
```

You’ll see lines like:

```bash
[2025-11-01T16:42:19.275Z] "GET / HTTP/1.1" 200 - via_upstream - "-" 0 22 1 1 "-" "curl/8.16.0" "c3af7028-29f0-95b8-818b-fbdec80ba206" "backend" "10.244.0.23:5678" outbound|80||backend.default.svc.cluster.local 10.244.0.24:47370 10.96.204.198:80 10.244.0.24:42446 - default
[2025-11-01T16:42:24.287Z] "GET / HTTP/1.1" 200 - via_upstream - "-" 0 22 1 1 "-" "curl/8.16.0" "cfb6430a-e804-9a8e-84da-bd9b597242d6" "backend" "10.244.0.23:5678" outbound|80||backend.default.svc.cluster.local 10.244.0.24:47370 10.96.204.198:80 10.244.0.24:42452 - default
```

That confirms requests are indeed being handled by Istio’s data plane.

---

## 🧩 Step 7: (Optional) Enable Access Logs Globally

If you don’t see logs, enable them:

```bash
istioctl install --set meshConfig.accessLogFile=/dev/stdout -y
```

Then recheck the logs again.

---

## 💬 Step 10: Sidecar vs. Ambient Mode (FYI)


| Feature        | Sidecar Mode                           | Ambient Mode               |
| ---------------- | ---------------------------------------- | ---------------------------- |
| Architecture   | Envoy proxy in each pod                | Shared node-level ztunnel  |
| Overhead       | Higher (one proxy per pod)             | Lower (one proxy per node) |
| L7 Features    | Full routing, retries, fault injection | Only basic L4 by default   |
| Upgrade Impact | Pod restarts needed                    | Transparent                |
| Maturity       | Production proven                      | Evolving (1.27+)           |

You’re using **Sidecar Mode** , which provides the richest feature set and full observability.

Ambient Mode is newer, lighter, and we’ll explore it in future posts once it stabilizes.

---

## ✅ Summary

In this post, you:

* Verified sidecar injection using annotations and init containers
* Inspected `istio-proxy` configuration and Envoy behavior
* Understood how traffic flows through Envoy sidecars
* Compared sidecar mode with ambient mode

Your mesh is now fully functional — **frontend** and **backend** communicate through secure, observable Envoy proxies.

---

### 🧵 Next Up

👉 **Istio Hands-on Part 4 – Traffic Management with VirtualService and DestinationRule**

We’ll start controlling traffic flow using canary releases, fault injection, and weighted routing.

[Istio Hands-on Part 4 – Traffic Management with VirtualService and DestinationRule](comming_soon)
