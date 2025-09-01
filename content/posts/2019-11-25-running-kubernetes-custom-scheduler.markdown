---
#layout: post
title: Running kubernetes custom scheduler
date: '2019-11-25 17:28:55'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

Kubernetes cluster have a default scheduler kube-scheduler. If the default scheduler does not suits our requirement we can also create our own scheduler. In the post we will discus how to create multiple scheduler and schedule pods based on different scheduler.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/setup-4.jpg" class="kg-image"></figure><!--kg-card-end: image-->
##### Step 1: Copy the default scheduler yaml and modify

Copy the default scheduler yaml from master node and modify the name.

In this below example i am naming the custom schedule are _my-scheduler._ Add a ServiceAccount and ClusterRoleBinding to the yaml file as given below.

The key changes made are

- line 27: name: my-scheduler
- line 30: serviceAccountName: my-scheduler
- line 38: - --leader-elect=false
- line 39: - --scheduler-name=my-scheduler
```bash

vikki@kubernetes1:~$ sudo cp /etc/kubernetes/manifests/kube-scheduler.yaml custom-scheduler.yaml
vikki@kubernetes1:~$ sudo chmod 777 custom-scheduler.yaml 
vikki@kubernetes1:~$ vim custom-scheduler.yaml 

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/2a8e765cb702a7f8edf4e8760599da10.js"></script><!--kg-card-end: html-->
##### Step 2: Create the custom scheduler
```bash

vikki@kubernetes1:~$ kubectl create -f custom-scheduler.yaml 
serviceaccount/my-scheduler created
clusterrolebinding.rbac.authorization.k8s.io/my-scheduler-as-kube-scheduler created
pod/my-scheduler created

``````bash

vikki@kubernetes1:~$ kubectl get pods -n=kube-system 
NAME READY STATUS RESTARTS AGE
calico-kube-controllers-55754f75c-fgs8g 1/1 Running 7 22d
calico-node-4h72l 1/1 Running 7 22d
calico-node-ld84s 1/1 Running 7 22d
calico-node-lrfz9 1/1 Running 2 31h
calico-node-ws576 1/1 Running 1 27h
coredns-5644d7b6d9-2g6rs 1/1 Running 7 22d
coredns-5644d7b6d9-ccxsg 1/1 Running 7 22d
etcd-kubernetes1 1/1 Running 8 22d
kube-apiserver-kubernetes1 1/1 Running 8 22d
kube-controller-manager-kubernetes1 1/1 Running 8 22d
kube-proxy-6xd8l 1/1 Running 2 31h
kube-proxy-96q5x 1/1 Running 7 22d
kube-proxy-njl6r 1/1 Running 7 22d
kube-proxy-whlhw 1/1 Running 1 27h
kube-scheduler-kubernetes1 1/1 Running 8 22d
my-scheduler 1/1 Running 0 6s

```

> Now we can see a new custom scheduler _my-scheduler_ is running along with defautl scheduler _kube-scheduler-kubernetes1_

##### Step 3: Edit the custerrole for kube-scheduler

If RBAC is enabled on your cluster, you must update the system:kube-scheduler cluster role. Edit the clusterrole for kube-scheduler and modify.

Below are the key changes made in orignal file

- line 33: - my-scheduler
- line 131: - storageclasses
```bash

vikki@kubernetes1:~$ kubectl edit clusterrole system:kube-scheduler

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/801aa697779378ff30e46e5247de8980.js"></script><!--kg-card-end: html-->
##### Step 4: Create pods with different types of scheduler

Create a pod without explicitly mentioning any scheuler name. This pod should be scheduled by default scheduler _kube-scheduler_

```bash

vikki@kubernetes1:~$ vim pod_default_scheduler.yaml

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/cfe05dda5b00a4f170b9cdd08f6aa0dd.js"></script><!--kg-card-end: html-->

Create a pod by explicitly mentioning custom scheuler name _my-scheduler_.

```bash

vikki@kubernetes1:~$ vim pod_custom_scheduler.yaml 

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/04cc5ac3e1933b4c1979a631de424116.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl create -f pod_default_scheduler.yaml 
pod/nginx-pod-default-scheduler created
vikki@kubernetes1:~$ kubectl create -f pod_custom_scheduler.yaml 
pod/nginx-pod-custom-scheduler created

``````bash

vikki@kubernetes1:~$ kubectl get pods nginx-pod-custom-scheduler nginx-pod-default-scheduler
NAME READY STATUS RESTARTS AGE
nginx-pod-custom-scheduler 1/1 Running 0 9m9s
nginx-pod-default-scheduler 1/1 Running 0 9m13s
vikki@kubernetes1:~$ 

```

> Now we can see both the pods are created and running

```bash

vikki@kubernetes1:~$ kubectl get events -o wide |grep nginx-pod-custom-scheduler |head -1
<unknown> Normal Scheduled pod/nginx-pod-custom-scheduler my-scheduler Successfully assigned default/nginx-pod-custom-scheduler to kubernetes3 <unknown> 0 nginx-pod-custom-scheduler.15da76383c2c2859

vikki@kubernetes1:~$ kubectl get events -o wide |grep nginx-pod-default-scheduler |head -1
<unknown> Normal Scheduled pod/nginx-pod-default-scheduler default-scheduler Successfully assigned default/nginx-pod-default-scheduler to kubernetes3 <unknown> 0 nginx-pod-default-scheduler.15da76372f4444f7

```

> From the events, we can see pod nginx-pod-custom-scheduler is scheduled by _my-scheduler_ and nginx-pod-default-scheduler by &nbsp;_default-scheduler._

