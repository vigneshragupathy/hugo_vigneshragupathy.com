---
#layout: post
title: Kubernetes stateful set with local-storage persistent volume
date: '2019-11-24 08:03:14'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

StatefulSets are similar to deployment contains identical container spec but ensures an order of the deployment. StatefulSets deploy pods in a sequential orders. Each pod as its own identity and is named with a unique ID. In the below post we are going to create a statefulsets and watch the behaviour during deletion of pod, scaling of pod and during update of container image.

The StatefulSets consist of a headless service, pods and a volume. We are going to use a local-storage volume for statefulsets. It is also common to dynamically allocate storage using &nbsp;volumeClaimTemplates, but due to some limitation in virtualbox i am using a manual allocation using PersistVolumeClaim.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/setup.jpg" class="kg-image"></figure><!--kg-card-end: image-->
##### Step 1: Create a persistentVolume and persistemVolumeClaim
```bash

vim pv.yaml

```

<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/b0fdde697229f150740a079b77458d64.js"></script><!--kg-card-end: html-->```bash

vim pv_claim.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/5f9f6acb132e499ccb80523b170dc815.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pv.yaml 
persistentvolume/vikki-pv-volume created

vikki@kubernetes1:~$ kubectl create -f pv_claim.yaml 
persistentvolumeclaim/vikki-pv-volume-claim created

``````bash

vikki@kubernetes1:~$ kubectl get pvc
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
vikki-pv-volume-claim Bound vikki-pv-volume 1Gi RWO local-storage 4s

vikki@kubernetes1:~$ kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
vikki-pv-volume 1Gi RWO Retain Bound default/vikki-pv-volume-claim local-storage 9s

```
##### Step 2: Create a statefulSets

Create a statefulSets and map the PVC created in previous steps. The statefull set consist of the following. -

- Headless service
- StatefulSets with container details
- Persistent Volumes 
```bash

vim ss.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/d04c1473a6dacc90fcc8af2946b54b92.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f ss.yaml 
service/nginx created
statefulset.apps/web created

```
##### Step 3: Verify statefulSets

Now we can see the statefulsets are created and the respecive pod is created with a sequential unique id.

```bash

vikki@kubernetes1:~$ kubectl get statefulsets.apps 
NAME READY AGE
web 2/2 6m40s

vikki@kubernetes1:~$ kubectl get pod -l app=nginx
NAME READY STATUS RESTARTS AGE
web-0 1/1 Running 0 15m
web-1 1/1 Running 0 15m

```
##### Step 4: Verify the DNS for statefulSets

Create a temporary busybox pod and test the dns resolution for each statefulSet pods based on the pod and stateful set name.

```bash

vikki@kubernetes1:~$ kubectl apply -f https://k8s.io/examples/admin/dns/busybox.yaml
pod/busybox created

``````bash

root@kubernetes2:~# docker ps -a |grep busybox
8e3ba8c16f3e busybox "sleep 3600" 21 seconds ago Up 20 seconds k8s_busybox_busybox_default_454e3e1c-1b41-4f6e-a244-6d89cd8c8379_0
9c890ad85c23 k8s.gcr.io/pause:3.1 "/pause" 28 seconds ago Up 27 seconds k8s_POD_busybox_default_454e3e1c-1b41-4f6e-a244-6d89cd8c8379_0

root@kubernetes2:~# docker exec -it k8s_busybox_busybox_default_454e3e1c-1b41-4f6e-a244-6d89cd8c8379_0 /bin/sh
/ # 
/ # ping web-0
ping: bad address 'web-0'
/ # ping web-0.nginx
PING web-0.nginx (192.168.249.183): 56 data bytes
64 bytes from 192.168.249.183: seq=0 ttl=63 time=0.551 ms
64 bytes from 192.168.249.183: seq=1 ttl=63 time=0.071 ms
^C
--- web-0.nginx ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.071/0.311/0.551 ms

/ # ping web-1.nginx
PING web-1.nginx (192.168.249.184): 56 data bytes
64 bytes from 192.168.249.184: seq=0 ttl=63 time=0.227 ms
64 bytes from 192.168.249.184: seq=1 ttl=63 time=0.256 ms
^C
--- web-1.nginx ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.227/0.241/0.256 ms
/ # 

```

> Now we can see both the statefulSets pods resolves for &nbsp;dns.

##### Step 5: Verify the order of pod creation on deletion

We can try deleting some pods and see how the new pods are creating

```bash

vikki@kubernetes1:~$ kubectl delete pod -l app=nginx
pod "web-0" deleted
pod "web-1" deleted
vikki@kubernetes1:~$ 

``````bash

vikki@kubernetes1:~$ kubectl get pod -w -l app=nginx
NAME READY STATUS RESTARTS AGE
web-0 1/1 Running 0 18m
web-1 1/1 Running 0 18m
web-0 1/1 Terminating 0 19m
web-1 1/1 Terminating 0 19m
web-0 0/1 Terminating 0 19m
web-1 0/1 Terminating 0 19m
web-1 0/1 Terminating 0 19m
web-1 0/1 Terminating 0 19m
web-0 0/1 Terminating 0 19m
web-0 0/1 Terminating 0 19m
web-0 0/1 Pending 0 0s
web-0 0/1 Pending 0 0s
web-0 0/1 ContainerCreating 0 0s
web-0 0/1 ContainerCreating 0 1s
web-0 1/1 Running 0 2s
web-1 0/1 Pending 0 0s
web-1 0/1 Pending 0 0s
web-1 0/1 ContainerCreating 0 0s
web-1 0/1 ContainerCreating 0 1s
web-1 1/1 Running 0 1s
^Cvikki@kubernetes1:~$ 

```

> We can see the pod are creating in ascending order preserving the sequence status

##### Step 6: Verify the order of pod creation on scalling

Now lets scale up and scale down the statefulset and watch the order of pod creation and deletion

```bash

vikki@kubernetes1:~$ kubectl scale statefulset --replicas=5 web 
statefulset.apps/web scaled

``````bash

vikki@kubernetes1:~$ kubectl get pod -w -l app=nginx
NAME READY STATUS RESTARTS AGE
web-0 1/1 Running 0 5m5s
web-1 1/1 Running 0 5m3s
web-2 0/1 Pending 0 0s
web-2 0/1 Pending 0 0s
web-2 0/1 ContainerCreating 0 0s
web-2 0/1 ContainerCreating 0 1s
web-2 1/1 Running 0 1s
web-3 0/1 Pending 0 0s
web-3 0/1 Pending 0 0s
web-3 0/1 ContainerCreating 0 0s
web-3 0/1 ContainerCreating 0 1s
web-3 1/1 Running 0 1s
web-4 0/1 Pending 0 0s
web-4 0/1 Pending 0 0s
web-4 0/1 ContainerCreating 0 1s
web-4 0/1 ContainerCreating 0 2s
web-4 1/1 Running 0 3s

``````bash

vikki@kubernetes1:~$ kubectl scale statefulset --replicas=3 web 
statefulset.apps/web scaled

``````bash

vikki@kubernetes1:~$ kubectl get pod -w -l app=nginx
NAME READY STATUS RESTARTS AGE
web-0 1/1 Running 0 5m44s
web-1 1/1 Running 0 5m42s
web-2 1/1 Running 0 19s
web-3 1/1 Running 0 18s
web-4 1/1 Running 0 17s
web-4 1/1 Terminating 0 40s
web-4 0/1 Terminating 0 42s
web-4 0/1 Terminating 0 47s
web-4 0/1 Terminating 0 47s
web-3 1/1 Terminating 0 48s
web-3 0/1 Terminating 0 49s
web-3 0/1 Terminating 0 58s
web-3 0/1 Terminating 0 58s

```

> We can see from the above output the sequential order is preserved

##### Step 6: Verify the order of pod creation on update

Now lets update the image in the statefulset and watch for the pod creation and deletion

```bash

vikki@kubernetes1:~$ kubectl get statefulsets.apps web -o yaml |grep updateStrategy -A 3
    updateStrategy:
    rollingUpdate:
        partition: 0
    type: RollingUpdate
vikki@kubernetes1:~$ 

```

> Current statefulsets has the updatestrategy of type "_RollingUpdate_"

Lets modify the container image to a different version

```bash

vikki@kubernetes1:~$ kubectl set image statefulset web nginx=k8s.gcr.io/nginx-slim:0.9
statefulset.apps/web image updated

``````bash

vikki@kubernetes1:~$ kubectl get pod -w -l app=nginx
NAME READY STATUS RESTARTS AGE
web-0 1/1 Running 0 9m57s
web-1 1/1 Running 0 9m55s
web-2 1/1 Running 0 4m32s
web-2 1/1 Terminating 0 5m29s
web-2 0/1 Terminating 0 5m30s
web-2 0/1 Terminating 0 5m39s
web-2 0/1 Terminating 0 5m39s
web-2 0/1 Pending 0 0s
web-2 0/1 Pending 0 0s
web-2 0/1 ContainerCreating 0 0s
web-2 0/1 ContainerCreating 0 1s
web-2 1/1 Running 0 32s
web-1 1/1 Terminating 0 11m
web-1 0/1 Terminating 0 11m
web-1 0/1 Terminating 0 11m
web-1 0/1 Terminating 0 11m
web-1 0/1 Pending 0 0s
web-1 0/1 Pending 0 0s
web-1 0/1 ContainerCreating 0 0s
web-1 0/1 ContainerCreating 0 1s
web-1 1/1 Running 0 2s
web-0 1/1 Terminating 0 11m
web-0 0/1 Terminating 0 11m
web-0 0/1 Terminating 0 11m
web-0 0/1 Terminating 0 11m
web-0 0/1 Pending 0 0s
web-0 0/1 Pending 0 0s
web-0 0/1 ContainerCreating 0 0s
web-0 0/1 ContainerCreating 0 1s
web-0 1/1 Running 0 2s

```

> We can see from the above output the sequential order is preserved

