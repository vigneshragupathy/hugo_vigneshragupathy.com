---
#layout: post
title: Creating persistent local-storage volume in Kubernetes
date: '2019-11-23 14:12:38'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

PersistentVolume and PersistentVolumeClaim in kubernetes provides a way to allocate storage for the pods. Kubernetes PV supports different types of storage. Now here in the below post we are going to use storage-class **local-storage** and watch the behaviour for different reclaimpolicy.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="/content/images/2019/11/Screenshot-from-2019-11-23-11-56-54-2.png" class="kg-image"></figure><!--kg-card-end: image-->
##### Step 1: Create a directory in one for the node and add a file
{% highlight console %}

root@kubernetes2:~# mkdir /pvdir
root@kubernetes2:~# echo "Hello world!" > /pvdir/index.html 
root@kubernetes2:~# cat /pvdir/index.html 
Hello world!

{% endhighlight %}
##### Step 2: Get the label of the node 

We need to get the label of the node where the directory is created.This we need to configure &nbsp;in the nodeAffinity specs in order to properly stick the pod to respective node where the local volume is present.

{% highlight console %}

vikki@kubernetes1:~$ kubectl get nodes --show-labels
NAME STATUS ROLES AGE VERSION LABELS
kubernetes1 Ready master 19d v1.16.2 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes1,kubernetes.io/os=linux,node-role.kubernetes.io/master=
kubernetes2 Ready <none> 19d v1.16.2 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=kubernetes2,kubernetes.io/os=linux

{% endhighlight %}
##### Step 3: Create a persistent volume(PV)

Create a PV and map the local storage director and configure the label in the node selector

{% highlight console %}

vikki@kubernetes1:~$ vim pv.yaml

{% endhighlight %}<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/b0fdde697229f150740a079b77458d64.js"></script><!--kg-card-end: html-->{% highlight console %}

vikki@kubernetes1:~$ kubectl create -f pv.yaml 
persistentvolume/vikki-pv-volume created

{% endhighlight %}
##### Step 4: Verify the PV status

Verify the PV status. It is currently configured with access type **RWO** and reclaim policy as **Delete**

{% highlight console %}

vikki@kubernetes1:~$ kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
vikki-pv-volume 1Gi RWO Delete Available local-storage 14s

{% endhighlight %}
##### Step 5: Create a persistent volume claim(PVC)

Create a PVC and map the above created PV

{% highlight console %}

vikki@kubernetes1:~$ vim pv_claim.yaml

{% endhighlight %}<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/5f9f6acb132e499ccb80523b170dc815.js"></script><!--kg-card-end: html-->{% highlight console %}

vikki@kubernetes1:~$ kubectl create -f pv_claim.yaml 
persistentvolumeclaim/vikki-pv-volume-claim created

{% endhighlight %}
##### Step 6: Verify the PVC status

Verify the PVC and PV status. Now we can see the status changes from _Available_ to _Bound._

{% highlight console %}

vikki@kubernetes1:~$ kubectl get pvc
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
vikki-pv-volume-claim Bound vikki-pv-volume 1Gi RWO local-storage 8s
vikki@kubernetes1:~$ kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
vikki-pv-volume 1Gi RWO Delete Bound default/vikki-pv-volume-claim local-storage 3m59s

{% endhighlight %}
##### Step 7: Create a pod and map the PVC

Create a pod and map the volumes as below

{% highlight console %}

vikki@kubernetes1:~$ kubectl run --image=nginx nginx-pod --generator=run-pod/v1 --dry-run -o yaml > pod.yaml

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ vim pod.yaml

{% endhighlight %}<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/76f42e185c516284f0babbdc3b67cd1a.js"></script><!--kg-card-end: html-->{% highlight console %}

vikki@kubernetes1:~$ kubectl create -f pod.yaml 
pod/nginx-pod created

{% endhighlight %}
##### Step 8: Verify the pod status and volume inside

Verify the status of the new pod and check the volume is mounted inside the container

{% highlight console %}

vikki@kubernetes1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
fluentd-elasticsearch-bwhfx 0/1 ImagePullBackOff 0 4h3m
fluentd-elasticsearch-pvlpv 0/1 ImagePullBackOff 0 4h3m
nginx-85ff79dd56-zqllr 1/1 Running 1 5h51m
nginx-pod 1/1 Running 0 10s

{% endhighlight %}{% highlight console %}

root@kubernetes2:~# docker ps -a |grep nginx-pod
e142048a048f nginx "nginx -g 'daemon of…" 20 seconds ago Up 20 seconds k8s_nginx-pod_nginx-pod_default_b6b900bb-b214-4b96-bc90-18b2358ee225_0
df59f401a38a k8s.gcr.io/pause:3.1 "/pause" 26 seconds ago Up 25 seconds k8s_POD_nginx-pod_default_b6b900bb-b214-4b96-bc90-18b2358ee225_0

{% endhighlight %}{% highlight console %}

root@kubernetes2:~# docker exec -it k8s_nginx-pod_nginx-pod_default_b6b900bb-b214-4b96-bc90-18b2358ee225_0 cat /usr/share/nginx/html/index.html
Hello world!

{% endhighlight %}

> Now we can see the directory from the PV is mounted in the pod and the files created are present

## Verify reclaim policy(Below steps are Optional)

##### Step 9: Delete PVC and verify PV

Now delete the pod and PVC and verify the status of PV

{% highlight console %}

vikki@kubernetes1:~$ kubectl delete pod nginx-pod
pod "nginx-pod" deleted

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl delete pvc vikki-pv-volume-claim 
persistentvolumeclaim "vikki-pv-volume-claim" deleted

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
vikki-pv-volume 1Gi RWO Delete Failed default/vikki-pv-volume-claim local-storage 5m30s

{% endhighlight %}

> We can see the staus of PV is automaticall changed to **Failed.** This is due the the reclaim policy **Delete**

##### Step 10: (Optional ) Try recreate PVC

We can optionally try recreating the PVC volume and verify the status

{% highlight console %}

vikki@kubernetes1:~$ kubectl create -f pv_claim.yaml 
persistentvolumeclaim/vikki-pv-volume-claim created

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
vikki-pv-volume 1Gi RWO Delete Failed default/vikki-pv-volume-claim local-storage 5m57s
vikki@kubernetes1:~$ kubectl get pvc
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
vikki-pv-volume-claim Pending local-storage 2m10s

{% endhighlight %}

> We can see the status of PV is still **Failed** and the PVC always in **Pending** and never creates

##### Step 11: Delete and create PV with reclaim policy as retain

Now lets clean up all PV and PVC and recreate PV with reclaim policy set as "Retain"

{% highlight console %}

vikki@kubernetes1:~$ kubectl delete pvc vikki-pv-volume-claim 
persistentvolumeclaim "vikki-pv-volume-claim" deleted

vikki@kubernetes1:~$ kubectl delete pv vikki-pv-volume 
persistentvolume "vikki-pv-volume" deleted

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ vim pv.yaml
persistentVolumeReclaimPolicy: Retain

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl create -f pv.yaml 
persistentvolume/vikki-pv-volume created
vikki@kubernetes1:~$ kubectl create -f pv_claim.yaml 
persistentvolumeclaim/vikki-pv-volume-claim created

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl get pvc,pv
NAME STATUS VOLUME CAPACITY ACCESS MODES STORAGECLASS AGE
persistentvolumeclaim/vikki-pv-volume-claim Bound vikki-pv-volume 1Gi RWO local-storage 99s

NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
persistentvolume/vikki-pv-volume 1Gi RWO Retain Bound default/vikki-pv-volume-claim local-storage 118s

{% endhighlight %}
##### Step 12: Delete the PVC and verify the status of PV

Now lets delete the PVC and verify the status of the PV

{% highlight console %}

vikki@kubernetes1:~$ kubectl delete pvc vikki-pv-volume-claim 
persistentvolumeclaim "vikki-pv-volume-claim" deleted

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl get pv
NAME CAPACITY ACCESS MODES RECLAIM POLICY STATUS CLAIM STORAGECLASS REASON AGE
vikki-pv-volume 1Gi RWO Retain Released default/vikki-pv-volume-claim local-storage 2m11s

{% endhighlight %}

> Now we can see the status of PV changes to "Released" instead of "Failed" due to the reclaim policy "Retain"

