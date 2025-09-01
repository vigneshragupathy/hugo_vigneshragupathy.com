---
#layout: post
title: Pod scheduling in kubernetes - detailed step by step
date: '2019-11-24 14:42:51'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

We can assign the pod to node based on various methods. Lets discuss all the below methods in the post

- Using nodeName
- Using labels in nodeSelector
- Node Affinity/Anti Affinity
- Pod Affinity/Anti Affinity
- Taints and tolerations

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/setup-2.jpg" class="kg-image"></figure><!--kg-card-end: image-->
### Using nodeName

##### Step 1: Create a pod and assign using nodeName
```bash

vikki@kubernetes1:~$ vim pod_node_name.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/5f329160b5846ba72beba94bd46f8860.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl apply -f pod_node_name.yaml 
pod/nginx-pod-nodename created

``````bash

vikki@kubernetes1:~$ kubectl get pods -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
busybox 1/1 Running 4 5h47m 192.168.249.141 kubernetes2 <none> <none>
nginx-pod-nodename 1/1 Running 0 8s 192.168.80.199 kubernetes3 <none> <none>
web-0 1/1 Running 2 5h21m 192.168.249.139 kubernetes2 <none> <none>
web-1 1/1 Running 2 5h21m 192.168.249.140 kubernetes2 <none> <none>
web-2 1/1 Running 2 5h22m 192.168.249.138 kubernetes2 <none> <none>

```

> Now we can see the pod is created in the node "kubernetes3" conifgued in nodeName option

<!--kg-card-begin: hr-->
* * *
<!--kg-card-end: hr-->
### Using labels in nodeSelector

##### Step 1: Add a new label to the node

Check the current lables using the below command

```bash

vikki@kubernetes1:~$ kubectl get nodes --show-labels 
NAME STATUS ROLES AGE VERSION LABELS
kubernetes1 Ready master 20d v1.16.2 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes1,kubernetes.io/os=linux,node-role.kubernetes.io/master=
kubernetes2 Ready <none> 20d v1.16.2 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes2,kubernetes.io/os=linux
kubernetes3 Ready <none> 117m v1.16.3 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes3,kubernetes.io/os=linux,namee=node3

```

Add a new lable "disktype=vhd" to the kubernetes3 node

```bash

vikki@kubernetes1:~$ kubectl label nodes kubernetes3 disktype=vhd
node/kubernetes3 labeled

vikki@kubernetes1:~$ kubectl get nodes --show-labels 
NAME STATUS ROLES AGE VERSION LABELS
kubernetes1 Ready master 20d v1.16.2 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes1,kubernetes.io/os=linux,node-role.kubernetes.io/master=
kubernetes2 Ready <none> 20d v1.16.2 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes2,kubernetes.io/os=linux
kubernetes3 Ready <none> 118m v1.16.3 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,disktype=vhd,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes3,kubernetes.io/os=linux,namee=node3

```
##### Step 2: Create a pod and assign using nodeSelector
```bash

vikki@kubernetes1:~$ vim pod_label.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/dc26cbe554bd78b4e17103bcd96d153f.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pod_label.yaml 
pod/nginx-pod-label created

``````bash

vikki@kubernetes1:~$ kubectl get pods -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
busybox 1/1 Running 3 4h50m 192.168.249.141 kubernetes2 <none> <none>
nginx-pod-label 1/1 Running 0 4m14s 192.168.80.195 kubernetes3 <none> <none>
web-0 1/1 Running 2 4h25m 192.168.249.139 kubernetes2 <none> <none>
web-1 1/1 Running 2 4h25m 192.168.249.140 kubernetes2 <none> <none>
web-2 1/1 Running 2 4h25m 192.168.249.138 kubernetes2 <none> <none>
vikki@kubernetes1:~$ 

```

> Now we can see the new pod is assinged to kubernetes3 based on nodeSelector label option

<!--kg-card-begin: hr-->
* * *
<!--kg-card-end: hr-->
### Advance pod scheduling

We can also assing the pod to a specific node using the Node/pod affinity and anti affinity rules.

Affinity types:

- requiredDuringSchedulingRequiredDuringExecution
- requiredDuringSchedulingIgnoredDuringExecution
- preferredDuringSchedulingIgnoredDuringExecution

Affinity operators:

- In
- NotIn
- Exists
- DoesNotExist
- Gt
- Lt

### Node Affinity/Anti Affinity

##### Step 1: Create a pod with node affinity 

Create a pod with node affinity specs and match the lable using matchExpressions spec

```bash

vikki@kubernetes1:~$ vim pod_node_affinity.yaml 

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/704e4a3ce125a5e66b5b754f9edcd874.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pod_node_affinity.yaml 
pod/nginx-pod-nodeaffinity created

``````bash

vikki@kubernetes1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
busybox 1/1 Running 3 5h17m
nginx-pod-label 1/1 Running 0 31m
nginx-pod-nodeaffinity 0/1 Pending 0 4s
web-0 1/1 Running 2 4h52m
web-1 1/1 Running 2 4h52m
web-2 1/1 Running 2 4h52m

``````bash

vikki@kubernetes1:~$ kubectl describe pods nginx-pod-nodeaffinity |grep Events: -A 3
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 3 node(s) didn't match node selector.
    

```

> Now the pod is failing because there is no node has the match lables

Lets add a label bandwidth to the kubernetes3 node

```bash

vikki@kubernetes1:~$ kubectl label nodes kubernetes3 bandwidth=100GB
node/kubernetes3 labeled

``````bash

vikki@kubernetes1:~$ kubectl describe pods nginx-pod-nodeaffinity |grep Events: -A 5
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 3 node(s) didn't match node selector.
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 3 node(s) didn't match node selector.
    Normal Scheduled <unknown> default-scheduler Successfully assigned default/nginx-pod-nodeaffinity to kubernetes3

``````bash

vikki@kubernetes1:~$ kubectl get pods -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
busybox 1/1 Running 3 5h23m 192.168.249.141 kubernetes2 <none> <none>
nginx-pod-label 1/1 Running 0 37m 192.168.80.195 kubernetes3 <none> <none>
nginx-pod-nodeaffinity 1/1 Running 0 6m16s 192.168.80.196 kubernetes3 <none> <none>
web-0 1/1 Running 2 4h58m 192.168.249.139 kubernetes2 <none> <none>
web-1 1/1 Running 2 4h58m 192.168.249.140 kubernetes2 <none> <none>
web-2 1/1 Running 2 4h59m 192.168.249.138 kubernetes2 <none> <none>
    

```

> Now we can see the node pod is successully assinged to the kubernetes3 node after adding the label

<!--kg-card-begin: hr-->
* * *
<!--kg-card-end: hr-->
### Pod Affinity/Anti Affinity

We can also assing the pod to a specific node using the pod affinity and anti affinity rules.

##### Step 1: Create a pod with pod affinity

Create a pod with pod affinity specs and match the lable using matchExpressions spec

```bash

vikki@kubernetes1:~$ vim pod_pod_affinity.yaml 

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/a4048e59449210e28e4bf66971c8d56a.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pod_pod_affinity.yaml 
pod/nginx-pod-podaffinity created

``````bash

vikki@kubernetes1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
busybox 1/1 Running 4 5h36m
nginx-pod-label 1/1 Running 0 49m
nginx-pod-nodeaffinity 1/1 Running 0 18m
nginx-pod-podaffinity 0/1 Pending 0 4s
web-0 1/1 Running 2 5h10m
web-1 1/1 Running 2 5h10m
web-2 1/1 Running 2 5h11m

``````bash

vikki@kubernetes1:~$ kubectl describe pods nginx-pod-podaffinity |grep Events: -A 5 
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 2 node(s) didn't match pod affinity rules, 2 node(s) didn't match pod affinity/anti-affinity.
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 2 node(s) didn't match pod affinity rules, 2 node(s) didn't match pod affinity/anti-affinity.

```

> Now the pod is failing because there is no pod running in any nodes that &nbsp;has the match lables

Lets create a new pod with the label configued previously

```bash

vikki@kubernetes1:~$ vim pod_label_podaffinity.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/09965427e66db5bc14443f49f2ed2a9d.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl apply -f pod_label_podaffinity.yaml 
pod/nginx-pod-web-nginx-backend created

``````bash

vikki@kubernetes1:~$ kubectl describe pods nginx-pod-podaffinity |grep Events: -A 5 
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 2 node(s) didn't match pod affinity rules, 2 node(s) didn't match pod affinity/anti-affinity.
    Warning FailedScheduling <unknown> default-scheduler 0/3 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 2 node(s) didn't match pod affinity rules, 2 node(s) didn't match pod affinity/anti-affinity.
    Normal Scheduled <unknown> default-scheduler Successfully assigned default/nginx-pod-podaffinity to kubernetes3

``````bash

vikki@kubernetes1:~$ kubectl get pods -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
busybox 1/1 Running 4 5h39m 192.168.249.141 kubernetes2 <none> <none>
nginx-pod-label 1/1 Running 0 52m 192.168.80.195 kubernetes3 <none> <none>
nginx-pod-nodeaffinity 1/1 Running 0 21m 192.168.80.196 kubernetes3 <none> <none>
nginx-pod-podaffinity 1/1 Running 0 3m2s 192.168.80.197 kubernetes3 <none> <none>
nginx-pod-web-nginx-backend 1/1 Running 0 14s 192.168.80.198 kubernetes3 <none> <none>
web-0 1/1 Running 2 5h13m 192.168.249.139 kubernetes2 <none> <none>
web-1 1/1 Running 2 5h13m 192.168.249.140 kubernetes2 <none> <none>
web-2 1/1 Running 2 5h14m 192.168.249.138 kubernetes2 <none> <none>

```

> Now we can see only the pod with lable app: web-nginx-backend is created, the previous pod is also created in the same node

<!--kg-card-begin: hr-->
* * *
<!--kg-card-end: hr-->
### Taints and tolerations

Node affinity is a property of pods that attracts them to a set of nodes. Taints are the opposite, they allow a node to repel a set of pods.

##### Step 1: Create a label to node and assign pod using nodeSelector
```bash

vikki@kubernetes1:~$ kubectl label nodes kubernetes4 app=highperformance
node/kubernetes4 labeled
vikki@kubernetes1:~$ kubectl get nodes kubernetes4 --show-labels 
NAME STATUS ROLES AGE VERSION LABELS
kubernetes4 Ready <none> 2m55s v1.16.3 app=highperformance,beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes4,kubernetes.io/os=linux

``````bash

    vikki@kubernetes1:~$ vim pod_label_1.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/fb98260bd5405feee85ca565b188933b.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pod_label_1.yaml 
pod/nginx-pod-taint created

``````bash

vikki@kubernetes1:~$ kubectl get pod nginx-pod-taint -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
nginx-pod-taint 1/1 Running 0 10m 192.168.48.129 kubernetes4 <none> <none>

```

> We can see the new pod nginx-pod-taint is created and assigned to kubernetes4 node

##### Step 2: Create a taint

Now lets create a taint "NoSchedule" and add to the kubernetes4 node.

```bash

vikki@kubernetes1:~$ kubectl taint nodes kubernetes4 key1=value1:NoSchedule
node/kubernetes4 tainted

vikki@kubernetes1:~$ kubectl get nodes kubernetes4 -o yaml |grep -i taint -A 3
    taints:
    - effect: NoSchedule
    key: key1
    value: value1

```
##### Step 3: Create a new pod and try assign to kubernetes4

Now create a new pod and use nodeSelector to assign to kubernetes4

```bash

vikki@kubernetes1:~$ vim pod_label_2.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/4da565b636ec481e4f6e5147b2419a93.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pod_label_2.yaml 
pod/nginx-pod-taint-2 created

``````bash

vikki@kubernetes1:~$ kubectl get pods nginx-pod-taint-2 -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
nginx-pod-taint-2 0/1 Pending 0 7s <none> <none> <none> <none>

``````bash

vikki@kubernetes1:~$ kubectl describe pod nginx-pod-taint-2 |grep -i events: -A 5
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Warning FailedScheduling <unknown> default-scheduler 0/4 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 3 node(s) didn't match node selector.
    Warning FailedScheduling <unknown> default-scheduler 0/4 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 3 node(s) didn't match node selector.

```

> We can see the pod creatation if failing due to the taints setting.

##### Step 4: Update the pod with tolerations

Now lets add toleration to the same pod for "NoSchedule" and apply the changes.

```bash

vikki@kubernetes1:~$ vim pod_label_3.yaml 

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/5790929db238b9276d4961d3a91e6a29.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl apply -f pod_label_3.yaml 
Warning: kubectl apply should be used on resource created by either kubectl create --save-config or kubectl apply
pod/nginx-pod-taint-2 configured

``````bash

vikki@kubernetes1:~$ kubectl describe pod nginx-pod-taint-2 |grep -i events: -A 5
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Warning FailedScheduling <unknown> default-scheduler 0/4 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 3 node(s) didn't match node selector.
    Warning FailedScheduling <unknown> default-scheduler 0/4 nodes are available: 1 node(s) had taints that the pod didn't tolerate, 3 node(s) didn't match node selector.
    Normal Scheduled <unknown> default-scheduler Successfully assigned default/nginx-pod-taint-2 to kubernetes4

``````bash

vikki@kubernetes1:~$ kubectl get pod nginx-pod-taint-2 -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
nginx-pod-taint-2 1/1 Running 0 11m 192.168.48.130 kubernetes4 <none> <none>

```

> Now we can see the pod changed from failed to success state and assinged to kubernetes4 node according to the nodeSelector.

