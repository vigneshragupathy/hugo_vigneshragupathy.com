---
#layout: post
title: Rolling updates and update strategy in Kubernetes daemonsets
date: '2019-11-23 08:54:21'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

Daemonset ensures that all the nodes run a copy of a pod. It can be used for running storage/monitoring daemons like glusterd,Prometheus etc. Now in this post we are going to see how to create a daemonset and do an image update. We are also going to perform different update strategy and watch the behaviour of damonset updates.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/Screenshot-from-2019-11-23-11-56-54-1.png" class="kg-image"></figure><!--kg-card-end: image-->
### Step 1: Create a daemon set 
```bash

vikki@kubernetes1:~$ kubectl create -f ds.yaml 
daemonset.apps/fluentd-elasticsearch created

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/467337d30e6018fae4d33af6d762f36d.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl get ds
NAME DESIRED CURRENT READY UP-TO-DATE AVAILABLE NODE SELECTOR AGE
fluentd-elasticsearch 2 2 2 2 2 <none> 5s

```
### Step 2: Verify the image version and updateStrategy of the daemonset
```bash

vikki@kubernetes1:~$ kubectl describe ds fluentd-elasticsearch |grep Image
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.2

vikki@kubernetes1:~$ kubectl get ds fluentd-elasticsearch -o yaml |grep -A 3 -i updateStrategy
    updateStrategy:
    rollingUpdate:
        maxUnavailable: 1
    type: RollingUpdate

vikki@kubernetes1:~$ kubectl get pod fluentd-elasticsearch-
fluentd-elasticsearch-7ds49 fluentd-elasticsearch-qh8n8  
vikki@kubernetes1:~$ kubectl describe pod fluentd-elasticsearch-7ds49 |grep Image:
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.2
    

```

> The daemonset has a image version of " **2.5.2"** and updateStrategy " **RollingUpdate**"

### Step 3: Update the daemon set container image to a different version say "2.5.2" 
```bash

vikki@kubernetes1:~$ kubectl set image ds fluentd-elasticsearch fluentd-elasticsearch=quay.io/fluentd_elasticsearch/fluentd:v2.5.1
daemonset.apps/fluentd-elasticsearch image updated

```
### step 4 : Verify the image version is updated in daemonset level also in pod level
```bash

vikki@kubernetes1:~$ kubectl describe ds fluentd-elasticsearch |grep Image
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.1

vikki@kubernetes1:~$ kubectl describe pod fluentd-elasticsearch-
fluentd-elasticsearch-qh8n8 fluentd-elasticsearch-x2f57  
vikki@kubernetes1:~$ kubectl describe pod fluentd-elasticsearch-qh8n8 |grep Image:
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.1

```

> Now we can see , as soon as the daemonset image is updated , the pod image also gets updated. This is because of the updateStrategy set as **RollingUpdate**

### Step 5: Now lets change the updateStrategy to OnDelete and watch the behaviour
```bash

vikki@kubernetes1:~$ kubectl get ds fluentd-elasticsearch -o yaml > ds_new.yaml 
vikki@kubernetes1:~$ vim ds_new.yaml 
    
    
    

```<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/573453ca14d2e79e02f3cfe6c7a3ef20.js"></script><!--kg-card-end: html-->```bash

vikki@kubernetes1:~$ kubectl apply -f ds_new.yaml 
Warning: kubectl apply should be used on resource created by either kubectl create --save-config or kubectl apply
daemonset.apps/fluentd-elasticsearch configured

``````bash

vikki@kubernetes1:~$ kubectl describe ds fluentd-elasticsearch |grep Image
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.1

vikki@kubernetes1:~$ kubectl get ds fluentd-elasticsearch -o yaml |grep -A 3 -i updateStrategy
--
    updateStrategy:
    rollingUpdate:
        maxUnavailable: 1
    type: OnDelete

vikki@kubernetes1:~$ kubectl describe pod fluentd-elasticsearch-qh8n8 |grep Image:
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.2
    

```

> The udpate strategy is changed to **OnDelete** and the version in **2.5.2**

### Step 6: Lets change the image to different version
```bash

vikki@kubernetes1:~$ kubectl set image ds fluentd-elasticsearch fluentd-elasticsearch=quay.io/fluentd_elasticsearch/fluentd:v2.5.0
daemonset.apps/fluentd-elasticsearch image updated

```
### Step 7: Verify the image version in daemonset and pod
```bash

vikki@kubernetes1:~$ kubectl describe ds fluentd-elasticsearch |grep Image
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.0

vikki@kubernetes1:~$ kubectl describe pod fluentd-elasticsearch-qh8n8 |grep Image:
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.2

```

> Now we can see the image version on Daemonset is updated , but the pod is still running in the older version

### Step 8: Lets delete the pod and wait for the new pods to be created and verify the image version in new pod
```bash

vikki@kubernetes1:~$ kubectl delete pod fluentd-elasticsearch-
fluentd-elasticsearch-qh8n8 fluentd-elasticsearch-x2f57  

vikki@kubernetes1:~$ kubectl delete pod fluentd-elasticsearch-qh8n8 fluentd-elasticsearch-x2f57
pod "fluentd-elasticsearch-qh8n8" deleted
pod "fluentd-elasticsearch-x2f57" deleted

``````bash

vikki@kubernetes1:~$ kubectl get pod fluentd-elasticsearch-
fluentd-elasticsearch-89g44 fluentd-elasticsearch-mf5f9  

vikki@kubernetes1:~$ kubectl get pod fluentd-elasticsearch-
fluentd-elasticsearch-89g44 fluentd-elasticsearch-mf5f9  

vikki@kubernetes1:~$ kubectl describe pod fluentd-elasticsearch-89g44 |grep Image:
    Image: quay.io/fluentd_elasticsearch/fluentd:v2.5.0

```

> Now we can see the version is automatically updated on the new pod only after delete.

