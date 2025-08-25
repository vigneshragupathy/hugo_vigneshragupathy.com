---
#layout: post
title: Kubernetes - Growing the cluster with Centos 7 node
date: '2018-06-15 12:14:00'
tags:
- linux
- opensource
- kubernetes
author: Vignesh Ragupathy
comments: true
---

In my [previous post](/kubernetes-on-ubuntu-18-04-with-dashbaoard/#kubernetes-token-generation) we seen how to install and configure kubernetes master node and dashboard on Ubuntu 18.04. Now this post is about growing the Kubernetes master by joining more nodes. For this setup i am going to use a Centos 7 VM running in virtualbox.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="/content/images/2018/06/vikki_centos7_vbox.jpg" class="kg-image" alt="vikki_centos7_vbox"></figure><!--kg-card-end: image-->
### Installation

Fist update the centos with all latest packages

{% highlight console %}

[root@drona-child-3 ~]# yum update -y

{% endhighlight %}

Install docker and enable in startup

{% highlight console %}

[root@drona-child-3 ~]# yum install docker
[root@drona-child-3 ~]# systemctl enable docker && systemctl start docker
Created symlink from /etc/systemd/system/multi-user.target.wants/docker.service to /usr/lib/systemd/system/docker.service.

{% endhighlight %}

Now add the kubernetes repository to yum configuration

{% highlight console %}

[root@drona-child-3 ~]# cat <<EOF > /etc/yum.repos.d/kubernetes.repo
> [kubernetes]
> name=Kubernetes
> baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
> enabled=1
> gpgcheck=1
> repo_gpgcheck=1
> gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
> EOF

{% endhighlight %}

Disable selinux. For permanant disable edit the file "/etc/sysconfig/selinux" &nbsp;otherwise the kube-flannel-xxx will goes to crashloop in next reboot.  
After that install kubernetes packages and enable in startup.

{% highlight console %}

[root@drona-child-3 ~]# setenforce 0
[root@drona-child-3 ~]# yum install -y kubelet kubeadm 
[root@drona-child-3 ~]# systemctl enable kubelet && systemctl start kubelet
Created symlink from /etc/systemd/system/multi-user.target.wants/kubelet.service to /etc/systemd/system/kubelet.service.
[root@drona-child-3 ~]# 

{% endhighlight %}

Add the host entry for name resolution

{% highlight console %}

[root@drona-child-3 ~]# cat /etc/hosts
127.0.0.1 localhost localhost.localdomain localhost4 localhost4.localdomain4
::1 localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.0.5 drona-child-1
192.168.0.4 drona-child-3
[root@drona-child-3 ~]# 

{% endhighlight %}

Disable swap

{% highlight console %}

[root@drona-child-3 ~]# swapoff -a

{% endhighlight %}

Till this step everything is same as we did in kubernetes master, except the difference of centos 7 operation system.

### Adding nodes to the cluster

Now join the node to the kubernetes master using the join command. We already seen in the [previous post](/kubernetes-on-ubuntu-18-04-with-dashbaoard/#kubernetes-token-generation) how to get the token and hash in case you didn't note it during master installation.

{% highlight console %}

[root@drona-child-3 ~]# kubeadm join 192.168.1.5:6443 --token o9an7t.o4bs1up74xjwnol3 --discovery-token-ca-cert-hash sha256:548c922cf4f845f3dc6d7da407516652879c8a5085c87e0322770e1475105591
[preflight] Running pre-flight checks.
    [WARNING FileExisting-crictl]: crictl not found in system path
Suggestion: go get github.com/kubernetes-incubator/cri-tools/cmd/crictl
[discovery] Trying to connect to API Server "192.168.1.5:6443"
[discovery] Created cluster-info discovery client, requesting info from "https://192.168.1.5:6443"
[discovery] Requesting info from "https://192.168.1.5:6443" again to validate TLS against the pinned public key
[discovery] Cluster info signature and contents are valid and TLS certificate validates against pinned roots, will use API Server "192.168.1.5:6443"
[discovery] Successfully established connection with API Server "192.168.1.5:6443"

This node has joined the cluster:
* Certificate signing request was sent to master and a response
    was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the master to see this node join the cluster.

{% endhighlight %}

Check if the flannel interface is created and should have the pod network ip 40.168.x.x

{% highlight console %}

[root@drona-child-3 ~]# ip a show flannel.1
5: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default 
    link/ether ee:0d:1d:5c:48:6a brd ff:ff:ff:ff:ff:ff
    inet 40.168.1.0/32 scope global flannel.1
        valid_lft forever preferred_lft forever
    inet6 fe80::ec0d:1dff:fe5c:486a/64 scope link 
        valid_lft forever preferred_lft forever
[root@drona-child-3 ~]# 

{% endhighlight %}

Since cluster and authentication keys(~/.kube/config) not configured in secondary nodes(drona-child-3) we cannot run kubectl get nodes in secondary.

We have to do all the orchestration activity from the master node. I am connecting to the master node and checking the nodes status

{% highlight console %}

vikki@drona-child-1:~$ kubectl get nodes
NAME STATUS ROLES AGE VERSION
drona-child-1 Ready master 22h v1.10.4
drona-child-3 Ready <none> 1m v1.10.4
vikki@drona-child-1:~$ 

{% endhighlight %}
### Creating deployment in kubernetes cluster

Let try deploying a pod. I am using nginx server. The below command will automatically pull the nginx image from the docker hub and deploy it as pod.

{% highlight console %}

vikki@drona-child-1:~$ kubectl run nginx --image nginx
deployment.apps "nginx" created
vikki@drona-child-1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-65899c769f-nllp5 1/1 Running 0 5m

{% endhighlight %}

Now we can see the deployment "nginx" is created.

{% highlight console %}

vikki@drona-child-1:~$ kubectl get deployments
NAME DESIRED CURRENT UP-TO-DATE AVAILABLE AGE
nginx 1 1 1 0 2s

{% endhighlight %}

To see more details about the deployment , use the describe command

{% highlight console %}

vikki@drona-child-1:~$ kubectl describe deployment nginx 
Name: nginx
Namespace: default
CreationTimestamp: Fri, 15 Jun 2018 15:13:02 +0530
Labels: run=nginx
Annotations: deployment.kubernetes.io/revision=1
Selector: run=nginx
Replicas: 1 desired | 1 updated | 1 total | 1 available | 0 unavailable
StrategyType: RollingUpdate
MinReadySeconds: 0
RollingUpdateStrategy: 1 max unavailable, 1 max surge
Pod Template:
    Labels: run=nginx
    Containers:
    nginx:
    Image: nginx
    Port: <none>
    Host Port: <none>
    Environment: <none>
    Mounts: <none>
    Volumes: <none>
Conditions:
    Type Status Reason
    ---- ------ ------
    Available True MinimumReplicasAvailable
    Progressing True NewReplicaSetAvailable
OldReplicaSets: <none>
NewReplicaSet: nginx-65899c769f (1/1 replicas created)
Events:
    Type Reason Age From Message
    ---- ------ ---- ---- -------
    Normal ScalingReplicaSet 9m deployment-controller Scaled up replica set nginx-65899c769f to 1
vikki@drona-child-1:~$ 

{% endhighlight %}
### Scaling the pods

Now let scale the pod to 3 replica

{% highlight console %}

vikki@drona-child-1:~$ kubectl scale deployment nginx --replicas=3
deployment.extensions "nginx" scaled
vikki@drona-child-1:~$ kubectl get deployment nginx 
NAME DESIRED CURRENT UP-TO-DATE AVAILABLE AGE
nginx 3 3 3 3 46m

{% endhighlight %}

List the pods and verify it.

{% highlight console %}

vikki@drona-child-1:~$ kubectl get pod -o wide
NAME READY STATUS RESTARTS AGE IP NODE
nginx-768979984b-6d27s 1/1 Running 0 1m 40.168.1.5 drona-child-3
nginx-768979984b-mmgbj 1/1 Running 0 1m 40.168.1.4 drona-child-3
nginx-768979984b-vm74x 1/1 Running 0 13m 40.168.1.3 drona-child-3
vikki@drona-child-1:~$ 


{% endhighlight %}

Now delete one of the pod and see if it is automatically scaling up to 3

{% highlight console %}

vikki@drona-child-1:~$ kubectl delete pod nginx-768979984b-vm74x 
pod "nginx-768979984b-vm74x" deleted
vikki@drona-child-1:~$ kubectl get pod -o wide
NAME READY STATUS RESTARTS AGE IP NODE
nginx-768979984b-6d27s 1/1 Running 0 6m 40.168.1.5 drona-child-3
nginx-768979984b-9lddt 0/1 ContainerCreating 0 2s <none> drona-child-3
nginx-768979984b-mmgbj 1/1 Running 0 6m 40.168.1.4 drona-child-3
nginx-768979984b-vm74x 0/1 Terminating 0 18m <none> drona-child-3
vikki@drona-child-1:~$ 

{% endhighlight %}{% highlight console %}

vikki@drona-child-1:~$ kubectl get pod -o wide
NAME READY STATUS RESTARTS AGE IP NODE
nginx-768979984b-6d27s 1/1 Running 0 6m 40.168.1.5 drona-child-3
nginx-768979984b-9lddt 1/1 Running 0 20s 40.168.1.6 drona-child-3
nginx-768979984b-mmgbj 1/1 Running 0 6m 40.168.1.4 drona-child-3
vikki@drona-child-1:~$ 

{% endhighlight %}