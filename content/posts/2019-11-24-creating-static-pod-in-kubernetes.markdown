---
#layout: post
title: Creating static pod in kubernetes
date: '2019-11-24 15:55:52'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

Static Pods are managed directly by the kubelet daemon on a specific node, without the API server observing them.  
Static pods automatically restarts if it crashes. Static Pods are always bound to one Kubelet on a specific node. In the post we will try creating a static pod and watch the behaviour on delete.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/setup-3.jpg" class="kg-image"></figure><!--kg-card-end: image-->
##### Step 1: Find the static pod manifest location

Go to any node where you want to run the static pod. I want to run in kubernetes3 node. Look for the kubelet process and config.yaml file associated with it

{% highlight console %}

root@kubernetes3:~# ps -aux |grep kubelet
root 905 3.6 9.4 544516 95676 ? Ssl 16:49 9:13 /usr/bin/kubelet --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf --config=/var/lib/kubelet/config.yaml --cgroup-driver=cgroupfs --network-plugin=cni --pod-infra-container-image=k8s.gcr.io/pause:3.1
root 29041 0.0 0.0 14224 940 pts/0 S+ 21:03 0:00 grep --color=auto kubelet

{% endhighlight %}

Now grep for the staticPodPath in config file

{% highlight console %}

root@kubernetes3:~# cat /var/lib/kubelet/config.yaml |grep static
staticPodPath: /etc/kubernetes/manifests

{% endhighlight %}
##### Step 2: Go to the directory and add a yaml for pod
{% highlight console %}

root@kubernetes3:~# cd /etc/kubernetes/manifests/
root@kubernetes3:/etc/kubernetes/manifests# vim static-pod.yaml

{% endhighlight %}<!--kg-card-begin: html--><script src="https://gist.github.com/vigneshragupathy/bbd1584780b98d771c479a4413c97b6e.js"></script><!--kg-card-end: html-->

Now try to grep for the pod name in the docker container list

{% highlight console %}

root@kubernetes3:/etc/kubernetes/manifests# docker ps -a |grep static-web
e5bf8054343a nginx "nginx -g 'daemon of…" 17 seconds ago Up 16 seconds k8s_web_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0
138ea3819894 k8s.gcr.io/pause:3.1 "/pause" 23 seconds ago Up 22 seconds k8s_POD_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0

{% endhighlight %}

> We can see a new static pod is created automatically

##### Step 3: Delete the container and watch the behaviour

Now lets try to delete the static pod &nbsp;

{% highlight console %}

root@kubernetes3:/etc/kubernetes/manifests# docker stop k8s_web_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0
k8s_web_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0
root@kubernetes3:/etc/kubernetes/manifests# docker rm k8s_web_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0
k8s_web_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0

{% endhighlight %}{% highlight console %}

root@kubernetes3:/etc/kubernetes/manifests# docker ps -a |grep static-web
d3d9713b937e nginx "nginx -g 'daemon of…" 1 second ago Up Less than a second k8s_web_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_1
138ea3819894 k8s.gcr.io/pause:3.1 "/pause" About a minute ago Up About a minute k8s_POD_static-web-kubernetes3_default_b42924f0dce4ce471e92742ee9bf65d7_0

{% endhighlight %}

> We can see the new static pod is automatically creating

