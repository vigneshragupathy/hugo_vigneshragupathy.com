---
#layout: post
title: Istio Hands-on Part 2 - Setting Up the Playground with Kind
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

In this post, we’ll set up our **local playground** for the Istio Hands-on series.You’ll learn how to:

1. Create a **Kind (Kubernetes-in-Docker)** cluster
2. Install **Istio** using the demo profile
3. Deploy a **sample application** to verify traffic through the mesh

This will be our foundation for the rest of the series — simple, reproducible, and lightweight.

---

## 🧱 Prerequisites

Before starting, make sure you have these installed on your machine:


| Tool     | Version (or higher) | Install link                                                                  |
| ---------- | --------------------- | ------------------------------------------------------------------------------- |
| Docker   | 20.x                | [Docker Install Guide](https://docs.docker.com/get-docker/)                   |
| kubectl  | 1.25+               | [kubectl install](https://kubernetes.io/docs/tasks/tools/)                    |
| kind     | 0.20+               | [Kind install](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)  |
| istioctl | 1.22+               | [Istio install](https://istio.io/latest/docs/setup/getting-started/#download) |

---

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

---


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

---

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

---

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

---

## 🧠 Step 3: Enable Automatic Sidecar Injection

Label the default namespace so Istio automatically injects Envoy sidecars:

```bash
kubectl label namespace default istio-injection=enabled
```

---

## 🧪 Step 4: Deploy a Sample Application

We’ll deploy a **simple microservice app** called `hello-mesh` with two components:

* **frontend** : a small web server that calls the backend
* **backend** : returns a simple message

This will help us test Istio features like routing, mTLS, and observability later.

---

### 4.1 Create the backend

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: hashicorp/http-echo
        args:
          - "-text=Hello from Backend v1"
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

---

### 4.2 Create the frontend

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: curlimages/curl
        command: ["sh", "-c"]
        args: ["while true; do curl -s http://backend; sleep 5; done"]
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
EOF
```

---

### 4.3 Verify the app

Check the pods:

```bash
kubectl get pods
```

✅ Expected output:

```bash
NAME                       READY   STATUS    RESTARTS   AGE
backend-684d96759f-p8psg   2/2     Running   0          35s
frontend-b7674d6f8-jjc42   2/2     Running   0          26s
```

View logs to confirm frontend is calling backend:

```bash
kubectl logs -l app=frontend --tail=10
```

✅ You should see:

```bash
Hello from Backend v1
Hello from Backend v1
```

---

## 🧩 Step 5: Verify Sidecar Injection

Run:

```bash
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].name}' | tr ' ' '\n' | sort | uniq -c
```

✅ Output should show both **frontend** and **backend** have an additional `istio-proxy` container — confirming sidecar injection is working.

---

## ✅ Summary

In this post, you:

* Created a local **Kind** cluster
* Installed **Istio** with the demo profile
* Deployed a **frontend-backend app** with sidecar injection
* Verified communication through the mesh

This is your **playground setup** for all upcoming hands-on experiments — routing, observability, mTLS, and beyond.

### 🧵 Next Up

👉 Istio Hands-on Part 3 - Sidecar Injection Deep Dive
We’ll explore how Envoy proxies intercept traffic, inspect configurations, and understand the flow inside the mesh.

---

[Istio Hands-on Part 3 - Sidecar Injection Deep Dive](comming_soon)
