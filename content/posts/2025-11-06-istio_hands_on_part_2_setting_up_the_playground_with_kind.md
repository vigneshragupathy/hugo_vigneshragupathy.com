---
#layout: post
title: Istio Hands-on Part 2 - Setting Up the Playground with Kind
date: '2025-11-06 00:50:00'
tags:
- kubernetes
- observability
author: Vignesh Ragupathy
comments: true
ShowToc: false
cover:
    image: ../../images/2025/istio_part2_cover.webp
    alt: Istio Part1 Cover
    hiddenInSingle: true
---
[⬅ Back to Intro](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) | [Next → Part 3 – Understanding Sidecar Injection and Traffic Flow](../istio-hands-on-part-3-understanding-sidecar-injection-and-traffic-flow)
### 🎯 Objective

In this post, we’ll set up our **local playground** for the Istio Hands-on series.You’ll learn how to:

1. Create a **Kind (Kubernetes-in-Docker)** cluster
2. Install **Istio** using the demo profile

This will be our foundation for the rest of the series — simple, reproducible, and lightweight.

---

## 🧱 Prerequisites

Before starting, make sure you have these installed on your machine:


| Tool     | Version (or higher) | Install link                                                                  |
| ---------- | --------------------- | ------------------------------------------------------------------------------- |
| Docker   | 20.x                | [Docker Install Guide](https://docs.docker.com/get-docker/)                   |
| kubectl  | 1.25+               | [kubectl install](https://kubernetes.io/docs/tasks/tools/)                    |
| kind     | 0.20+               | [Kind install](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)  |

## 🧩 Step 1: Create a Kind Cluster

Let’s create a simple Kind cluster with an ingress-ready configuration.
We’ll call it `istio-lab`.

```bash
cat <<EOF > kind-istio-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: istio-lab
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30000
        hostPort: 30000
      - containerPort: 30001
        hostPort: 30001
EOF
```

Now create the cluster:

```bash
kind create cluster --config kind-istio-config.yaml
```

Verify it’s running:

```bash
kubectl cluster-info
kubectl get nodes
```

✅ You should see something like:

```bash
NAME                      STATUS   ROLES           AGE   VERSION
istio-lab-control-plane   Ready    control-plane   48s   v1.33.1
```

## 🚀 Step 2: Install Istio

We’ll use the **demo profile** , which includes:

* Istiod (control plane)
* Ingress Gateway
* Default telemetry (Prometheus, Kiali, Grafana, Jaeger)

### 2.1 Download and add Istio CLI to PATH

```bash
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.*
export PATH=$PWD/bin:$PATH
```

Check it’s working:

```bash
istioctl version
```

✅ You should see something like:

```bash
Istio is not present in the cluster: no running Istio pods in namespace "istio-system"
client version: 1.27.3
```

### 2.2 Install Istio using the demo profile

```bash
istioctl install --set profile=demo -y
```

✅ You should see:

```bash
        |\
        | \
        |  \
        |   \
      /||    \
     / ||     \
    /  ||      \
   /   ||       \
  /    ||        \
 /     ||         \
/______||__________\
____________________
  \__       _____/
     \_____/

✔ Istio core installed ⛵️
✔ Istiod installed 🧠
✔ Egress gateways installed 🛫
✔ Ingress gateways installed 🛬
✔ Installation complete
```

Verify the pods:

```bash
kubectl get pods -n istio-system
```

✅ Expected output:

```bash
NAME                                    READY   STATUS    RESTARTS   AGE
istio-egressgateway-5b6b664d8-cz8bl     1/1     Running   0          86s
istio-ingressgateway-7d7f977654-lbt5f   1/1     Running   0          85s
istiod-86db895df-lmpt8                  1/1     Running   0          112s
```

### 🧵 Next Up

[👉 Istio Hands-on Part 3 - Understanding Sidecar Injection and Traffic Flow](../istio-hands-on-part-3-understanding-sidecar-injection-and-traffic-flow)

We’ll explore how Envoy proxies intercept traffic, inspect configurations, and understand the flow inside the mesh.

---

[⬅ Back to Intro](../istio-hands-on-part-1-from-kubernetes-to-service-mesh) | [Next → Part 3 – Understanding Sidecar Injection and Traffic Flow](../istio-hands-on-part-3-understanding-sidecar-injection-and-traffic-flow)
