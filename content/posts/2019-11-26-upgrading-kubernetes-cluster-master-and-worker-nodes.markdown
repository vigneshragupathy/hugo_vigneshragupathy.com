---
#layout: post
title: Upgrading kubernetes cluster master and worker nodes
date: '2019-11-26 15:07:58'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

This post we are going to discuss how to upgrade the kubernetes cluster, both master and worker nodes. We are going to upgrade a older version v1.15 to v.1.16.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/setup-5.jpg" class="kg-image"></figure><!--kg-card-end: image-->
### Master node

##### Step 1: Verify the current version of kubelet and kubeadm running in all nodes
{% highlight console %}

vikki@kubernetes1:~$ kubectl get nodes
NAME STATUS ROLES AGE VERSION
kubernetes1 Ready master 41d v1.15.5
kubernetes2 Ready <none> 41d v1.15.5

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubeadm version
kubeadm version: &version.Info{Major:"1", Minor:"15", GitVersion:"v1.15.5", GitCommit:"20c265fef0741dd71a66480e35bd69f18351daea", GitTreeState:"clean", BuildDate:"2019-10-15T19:14:19Z", GoVersion:"go1.12.10", Compiler:"gc", Platform:"linux/amd64"}

{% endhighlight %}

> We can see kubelet and kubeadm is running in version v1.15.5

##### Step 2: Verify the lastest stable availble version

Run the update in kubernetes master node

{% highlight console %}

root@kubernetes1:~# apt update

{% endhighlight %}{% highlight console %}

root@kubernetes1:~# apt-cache policy kubeadm
kubeadm:
    Installed: 1.15.5-00
    Candidate: 1.16.3-00
    Version table:
    .....

{% endhighlight %}

> We can see from this output that current version is 1.15.5 and the latest available is 1.16.3

##### Step 3: Upgrade the kubeadm to latest version

Upgrade the kubeadm in master to the latest version 1.16.3

{% highlight console %}

root@kubernetes1:~# apt-mark unhold kubeadm && \
> apt-get update && apt-get install -y kubeadm=1.16.3-00 && \
> apt-mark hold kubeadm
kubeadm was already not hold.
Hit:1 http://us.archive.ubuntu.com/ubuntu xenial InRelease                  
Hit:2 http://security.ubuntu.com/ubuntu xenial-security InRelease
Hit:3 http://us.archive.ubuntu.com/ubuntu xenial-updates InRelease
Hit:4 http://us.archive.ubuntu.com/ubuntu xenial-backports InRelease
Hit:5 https://apt.kubernetes.io kubernetes-xenial InRelease
Reading package lists... Done
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following packages will be upgraded:
    kubeadm
1 upgraded, 0 newly installed, 0 to remove and 142 not upgraded.
Need to get 8,762 kB of archives.
After this operation, 4,062 kB of additional disk space will be used.
Get:1 https://apt.kubernetes.io kubernetes-xenial/main amd64 kubeadm amd64 1.16.3-00 [8,762 kB]
Fetched 8,762 kB in 7s (1,117 kB/s)                                                                                                                          
(Reading database ... 60808 files and directories currently installed.)
Preparing to unpack .../kubeadm_1.16.3-00_amd64.deb ...
Unpacking kubeadm (1.16.3-00) over (1.15.5-00) ...
Setting up kubeadm (1.16.3-00) ...
kubeadm set on hold.

{% endhighlight %}
##### Step 4: Run the upgrade plan

Now in the previous step we already updated the kubeadm to latest version. Now lets run the upgrade plan and see the available options.

{% highlight console %}

root@kubernetes1:~# sudo kubeadm upgrade plan
[upgrade/config] Making sure the configuration is correct:
[upgrade/config] Reading configuration from the cluster...
[upgrade/config] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[preflight] Running pre-flight checks.
[upgrade] Making sure the cluster is healthy:
[upgrade] Fetching available versions to upgrade to
[upgrade/versions] Cluster version: v1.15.5
[upgrade/versions] kubeadm version: v1.16.3
[upgrade/versions] Latest stable version: v1.16.3
[upgrade/versions] Latest version in the v1.15 series: v1.15.6

Components that must be upgraded manually after you have upgraded the control plane with 'kubeadm upgrade apply':
COMPONENT CURRENT AVAILABLE
Kubelet 2 x v1.15.5 v1.15.6

Upgrade to the latest version in the v1.15 series:

COMPONENT CURRENT AVAILABLE
API Server v1.15.5 v1.15.6
Controller Manager v1.15.5 v1.15.6
Scheduler v1.15.5 v1.15.6
Kube Proxy v1.15.5 v1.15.6
CoreDNS 1.3.1 1.6.2
Etcd 3.3.10 3.3.10

You can now apply the upgrade by executing the following command:

    kubeadm upgrade apply v1.15.6

_____________________________________________________________________

Components that must be upgraded manually after you have upgraded the control plane with 'kubeadm upgrade apply':
COMPONENT CURRENT AVAILABLE
Kubelet 2 x v1.15.5 v1.16.3

Upgrade to the latest stable version:

COMPONENT CURRENT AVAILABLE
API Server v1.15.5 v1.16.3
Controller Manager v1.15.5 v1.16.3
Scheduler v1.15.5 v1.16.3
Kube Proxy v1.15.5 v1.16.3
CoreDNS 1.3.1 1.6.2
Etcd 3.3.10 3.3.15-0

You can now apply the upgrade by executing the following command:

    kubeadm upgrade apply v1.16.3

_____________________________________________________________________

{% endhighlight %}

> We can see that we can upgrade the cluster to v1.16.3 from the above output

##### Step 5: Drain the pods in master node

Now drain all the pods execpt daemonsets in the master node

{% highlight console %}

vikki@kubernetes1:~$ kubectl drain kubernetes1 --ignore-daemonsets
node/kubernetes1 cordoned
WARNING: ignoring DaemonSet-managed Pods: kube-system/kube-flannel-ds-amd64-bfr9j, kube-system/kube-proxy-8267n
evicting pod "coredns-5c98db65d4-v4cms"
evicting pod "coredns-5c98db65d4-g4gv4"
pod/coredns-5c98db65d4-v4cms evicted
pod/coredns-5c98db65d4-g4gv4 evicted
node/kubernetes1 evicted

{% endhighlight %}
##### Step 6: Run the upgrade

Now run the upgrade to the lastest version 1.16.3

{% highlight console %}

vikki@kubernetes1:~$ sudo kubeadm upgrade apply v1.16.3
[upgrade/config] Making sure the configuration is correct:
[upgrade/config] Reading configuration from the cluster...
[upgrade/config] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[preflight] Running pre-flight checks.
[upgrade] Making sure the cluster is healthy:
[upgrade/version] You have chosen to change the cluster version to "v1.16.3"
[upgrade/versions] Cluster version: v1.15.5
[upgrade/versions] kubeadm version: v1.16.3
[upgrade/confirm] Are you sure you want to proceed with the upgrade? [y/N]: y
[upgrade/prepull] Will prepull images for components [kube-apiserver kube-controller-manager kube-scheduler etcd]
[upgrade/prepull] Prepulling image for component etcd.
[upgrade/prepull] Prepulling image for component kube-apiserver.
[upgrade/prepull] Prepulling image for component kube-controller-manager.
[upgrade/prepull] Prepulling image for component kube-scheduler.
[apiclient] Found 0 Pods for label selector k8s-app=upgrade-prepull-etcd
[apiclient] Found 0 Pods for label selector k8s-app=upgrade-prepull-kube-scheduler
[apiclient] Found 1 Pods for label selector k8s-app=upgrade-prepull-kube-controller-manager
[apiclient] Found 1 Pods for label selector k8s-app=upgrade-prepull-kube-apiserver
[apiclient] Found 1 Pods for label selector k8s-app=upgrade-prepull-etcd
[apiclient] Found 1 Pods for label selector k8s-app=upgrade-prepull-kube-scheduler
[upgrade/prepull] Prepulled image for component etcd.
[upgrade/prepull] Prepulled image for component kube-apiserver.
[upgrade/prepull] Prepulled image for component kube-controller-manager.
[upgrade/prepull] Prepulled image for component kube-scheduler.
[upgrade/prepull] Successfully prepulled the images for all the control plane components
[upgrade/apply] Upgrading your Static Pod-hosted control plane to version "v1.16.3"...
Static pod: kube-apiserver-kubernetes1 hash: b9d225e73ea8b0b21921bdd78ea5415e
Static pod: kube-controller-manager-kubernetes1 hash: f106f0d94b93b77e4db974b1c477d277
Static pod: kube-scheduler-kubernetes1 hash: 131c3f63daec7c0750818f64a2f75d20
[upgrade/etcd] Upgrading to TLS for etcd
Static pod: etcd-kubernetes1 hash: 352a2620657e49493504dc8f27c83195
[upgrade/staticpods] Preparing for "etcd" upgrade
[upgrade/staticpods] Renewing etcd-server certificate
[upgrade/staticpods] Renewing etcd-peer certificate
[upgrade/staticpods] Renewing etcd-healthcheck-client certificate
[upgrade/staticpods] Moved new manifest to "/etc/kubernetes/manifests/etcd.yaml" and backed up old manifest to "/etc/kubernetes/tmp/kubeadm-backup-manifests-2019-11-26-18-04-49/etcd.yaml"
[upgrade/staticpods] Waiting for the kubelet to restart the component
[upgrade/staticpods] This might take a minute or longer depending on the component/version gap (timeout 5m0s)
Static pod: etcd-kubernetes1 hash: 352a2620657e49493504dc8f27c83195
Static pod: etcd-kubernetes1 hash: 3ce412f7cfe0c06939809c93f738e798
[apiclient] Found 1 Pods for label selector component=etcd
[upgrade/staticpods] Component "etcd" upgraded successfully!
[upgrade/etcd] Waiting for etcd to become available
[upgrade/staticpods] Writing new Static Pod manifests to "/etc/kubernetes/tmp/kubeadm-upgraded-manifests001214141"
[upgrade/staticpods] Preparing for "kube-apiserver" upgrade
[upgrade/staticpods] Renewing apiserver certificate
[upgrade/staticpods] Renewing apiserver-kubelet-client certificate
[upgrade/staticpods] Renewing front-proxy-client certificate
[upgrade/staticpods] Renewing apiserver-etcd-client certificate
[upgrade/staticpods] Moved new manifest to "/etc/kubernetes/manifests/kube-apiserver.yaml" and backed up old manifest to "/etc/kubernetes/tmp/kubeadm-backup-manifests-2019-11-26-18-04-49/kube-apiserver.yaml"
[upgrade/staticpods] Waiting for the kubelet to restart the component
[upgrade/staticpods] This might take a minute or longer depending on the component/version gap (timeout 5m0s)
Static pod: kube-apiserver-kubernetes1 hash: b9d225e73ea8b0b21921bdd78ea5415e
Static pod: kube-apiserver-kubernetes1 hash: b9d225e73ea8b0b21921bdd78ea5415e
Static pod: kube-apiserver-kubernetes1 hash: b9d225e73ea8b0b21921bdd78ea5415e
Static pod: kube-apiserver-kubernetes1 hash: d8708cb2f25dd11bbb41dd9729149325
[apiclient] Found 1 Pods for label selector component=kube-apiserver
[upgrade/staticpods] Component "kube-apiserver" upgraded successfully!
[upgrade/staticpods] Preparing for "kube-controller-manager" upgrade
[upgrade/staticpods] Renewing controller-manager.conf certificate
[upgrade/staticpods] Moved new manifest to "/etc/kubernetes/manifests/kube-controller-manager.yaml" and backed up old manifest to "/etc/kubernetes/tmp/kubeadm-backup-manifests-2019-11-26-18-04-49/kube-controller-manager.yaml"
[upgrade/staticpods] Waiting for the kubelet to restart the component
[upgrade/staticpods] This might take a minute or longer depending on the component/version gap (timeout 5m0s)
Static pod: kube-controller-manager-kubernetes1 hash: f106f0d94b93b77e4db974b1c477d277
Static pod: kube-controller-manager-kubernetes1 hash: e6e76bb8264f2e84070efada35e93e71
[apiclient] Found 1 Pods for label selector component=kube-controller-manager
[upgrade/staticpods] Component "kube-controller-manager" upgraded successfully!
[upgrade/staticpods] Preparing for "kube-scheduler" upgrade
[upgrade/staticpods] Renewing scheduler.conf certificate
[upgrade/staticpods] Moved new manifest to "/etc/kubernetes/manifests/kube-scheduler.yaml" and backed up old manifest to "/etc/kubernetes/tmp/kubeadm-backup-manifests-2019-11-26-18-04-49/kube-scheduler.yaml"
[upgrade/staticpods] Waiting for the kubelet to restart the component
[upgrade/staticpods] This might take a minute or longer depending on the component/version gap (timeout 5m0s)
Static pod: kube-scheduler-kubernetes1 hash: 131c3f63daec7c0750818f64a2f75d20
Static pod: kube-scheduler-kubernetes1 hash: 8c5e33e50bb56e8adacd1cc99c56b2cb
[apiclient] Found 1 Pods for label selector component=kube-scheduler
[upgrade/staticpods] Component "kube-scheduler" upgraded successfully!
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config-1.16" in namespace kube-system with the configuration for the kubelets in the cluster
[kubelet-start] Downloading configuration for the kubelet from the "kubelet-config-1.16" ConfigMap in the kube-system namespace
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy

[upgrade/successful] SUCCESS! Your cluster was upgraded to "v1.16.3". Enjoy!

[upgrade/kubelet] Now that your control plane is upgraded, please proceed with upgrading your kubelets if you haven't already done so.

{% endhighlight %}

> We can see the cluster is upgraded to lastest version v1.16.3

##### Step 7: Uncordon the master node

Now ucordon the master node

{% highlight console %}

vikki@kubernetes1:~$ kubectl uncordon kubernetes1 
node/kubernetes1 uncordoned

{% endhighlight %}
##### Step 8: Upgrade the kubelet 

Now in the previous steps we have upgraded the kubeadm and cluster , next we need to upgrade the kubelet and kubectl

{% highlight console %}

root@kubernetes1:~# apt-mark unhold kubelet kubectl && \
> apt-get update && apt-get install -y kubelet=1.16.3-00 kubectl=1.16.3-00 && \
> apt-mark hold kubelet kubectl
kubelet was already not hold.
kubectl was already not hold.
Hit:1 http://security.ubuntu.com/ubuntu xenial-security InRelease           
Hit:2 http://us.archive.ubuntu.com/ubuntu xenial InRelease
Hit:3 http://us.archive.ubuntu.com/ubuntu xenial-updates InRelease
Hit:4 http://us.archive.ubuntu.com/ubuntu xenial-backports InRelease
Hit:5 https://apt.kubernetes.io kubernetes-xenial InRelease
Reading package lists... Done
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following packages will be upgraded:
    kubectl kubelet
2 upgraded, 0 newly installed, 0 to remove and 140 not upgraded.
Need to get 29.9 MB of archives.
After this operation, 7,134 kB of additional disk space will be used.
Get:1 https://apt.kubernetes.io kubernetes-xenial/main amd64 kubectl amd64 1.16.3-00 [9,233 kB]
Get:2 https://apt.kubernetes.io kubernetes-xenial/main amd64 kubelet amd64 1.16.3-00 [20.7 MB]                                                               
Fetched 29.9 MB in 8s (3,436 kB/s)                                                                                                                           
(Reading database ... 60808 files and directories currently installed.)
Preparing to unpack .../kubectl_1.16.3-00_amd64.deb ...
Unpacking kubectl (1.16.3-00) over (1.15.5-00) ...
Preparing to unpack .../kubelet_1.16.3-00_amd64.deb ...
Unpacking kubelet (1.16.3-00) over (1.15.5-00) ...
Setting up kubectl (1.16.3-00) ...
Setting up kubelet (1.16.3-00) ...
kubelet set on hold.
kubectl set on hold.

{% endhighlight %}

Restart the kubelet service

{% highlight console %}

root@kubernetes1:~# sudo systemctl restart kubelet

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl get nodes
NAME STATUS ROLES AGE VERSION
kubernetes1 Ready master 41d v1.16.3
kubernetes2 Ready <none> 41d v1.15.5

{% endhighlight %}

> Now we can see the master node kubernetes1 is upgraded to v1.16.3

### Worker node

##### Step 1: Upgrade the kubeadm to version 1.16.3
{% highlight console %}

root@kubernetes2:~# apt-mark unhold kubeadm && \
> apt-get update && apt-get install -y kubeadm=1.16.3-00 && \
> apt-mark hold kubeadm
kubeadm was already not hold.
Get:1 http://security.ubuntu.com/ubuntu xenial-security InRelease [109 kB]                 
Get:2 http://security.ubuntu.com/ubuntu xenial-security/main amd64 Packages [785 kB]       
Hit:3 http://us.archive.ubuntu.com/ubuntu xenial InRelease
Get:4 http://us.archive.ubuntu.com/ubuntu xenial-updates InRelease [109 kB]      
Get:5 https://apt.kubernetes.io kubernetes-xenial InRelease [161 B]
Get:6 https://apt.kubernetes.io kubernetes-xenial/main amd64 Packages [31.3 kB]                      
Get:7 http://us.archive.ubuntu.com/ubuntu xenial-backports InRelease [107 kB]        
Get:8 http://us.archive.ubuntu.com/ubuntu xenial-updates/main amd64 Packages [1,071 kB]             
Get:9 http://security.ubuntu.com/ubuntu xenial-security/main i386 Packages [617 kB]     
Get:10 http://security.ubuntu.com/ubuntu xenial-security/main Translation-en [302 kB]                                                                        
Get:11 http://security.ubuntu.com/ubuntu xenial-security/universe amd64 Packages [466 kB]                                                                    
Get:12 http://us.archive.ubuntu.com/ubuntu xenial-updates/main i386 Packages [882 kB]                                                                        
Get:13 http://security.ubuntu.com/ubuntu xenial-security/universe i386 Packages [401 kB]                                                                     
Get:14 http://security.ubuntu.com/ubuntu xenial-security/universe Translation-en [191 kB]                                                                    
Get:15 http://security.ubuntu.com/ubuntu xenial-security/multiverse amd64 Packages [5,724 B]                                                                 
Get:16 http://security.ubuntu.com/ubuntu xenial-security/multiverse i386 Packages [5,888 B]                                                                  
Get:17 http://us.archive.ubuntu.com/ubuntu xenial-updates/main Translation-en [413 kB]                                                                       
Get:18 http://us.archive.ubuntu.com/ubuntu xenial-updates/universe amd64 Packages [771 kB]                                                                   
Get:19 http://us.archive.ubuntu.com/ubuntu xenial-updates/universe i386 Packages [700 kB]                                                                    
Get:20 http://us.archive.ubuntu.com/ubuntu xenial-updates/universe Translation-en [324 kB]                                                                   
Get:21 http://us.archive.ubuntu.com/ubuntu xenial-updates/multiverse amd64 Packages [16.8 kB]                                                                
Get:22 http://us.archive.ubuntu.com/ubuntu xenial-updates/multiverse i386 Packages [15.9 kB]                                                                 
Fetched 7,333 kB in 23s (315 kB/s)                                                                                                                           
Reading package lists... Done
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following packages will be upgraded:
    kubeadm
1 upgraded, 0 newly installed, 0 to remove and 139 not upgraded.
Need to get 8,762 kB of archives.
After this operation, 4,062 kB of additional disk space will be used.
Get:1 https://apt.kubernetes.io kubernetes-xenial/main amd64 kubeadm amd64 1.16.3-00 [8,762 kB]
Fetched 8,762 kB in 7s (1,122 kB/s)                                                                                                                          
(Reading database ... 60808 files and directories currently installed.)
Preparing to unpack .../kubeadm_1.16.3-00_amd64.deb ...
Unpacking kubeadm (1.16.3-00) over (1.15.5-00) ...
Setting up kubeadm (1.16.3-00) ...
kubeadm set on hold.

{% endhighlight %}
##### Step 2: Drain the pods in worker node

Now drain all the pods , except daemonsets from the worker node kubernetes2. _This command should be run in master node in case the kubenetes config is not mapped in worker_.

{% highlight console %}

vikki@kubernetes1:~$ kubectl drain kubernetes2 --ignore-daemonsets
node/kubernetes2 cordoned
WARNING: ignoring DaemonSet-managed Pods: kube-system/kube-flannel-ds-amd64-8v6lb, kube-system/kube-proxy-877b2
evicting pod "coredns-5644d7b6d9-t8qw5"
evicting pod "httpd-7765f5994-gvlj6"
evicting pod "nginx-7bffc778db-phdb5"
evicting pod "coredns-5644d7b6d9-frz4v"
pod/coredns-5644d7b6d9-frz4v evicted
pod/coredns-5644d7b6d9-t8qw5 evicted
pod/httpd-7765f5994-gvlj6 evicted
pod/nginx-7bffc778db-phdb5 evicted
node/kubernetes2 evicted

{% endhighlight %}
##### Step 3: Upgrade the worker node
{% highlight console %}

root@kubernetes2:~# sudo kubeadm upgrade node
[upgrade] Reading configuration from the cluster...
[upgrade] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[upgrade] Skipping phase. Not a control plane node[kubelet-start] Downloading configuration for the kubelet from the "kubelet-config-1.16" ConfigMap in the kube-system namespace
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[upgrade] The configuration for this node was successfully updated!
[upgrade] Now you should go ahead and upgrade the kubelet package using your package manager.

{% endhighlight %}
##### Step 4: Upgrade the kubelet and kubectl

In previous steps we upgraded the kubeadm and cluster. Now we need to upgrade the kubelet and kubectl.

{% highlight console %}

root@kubernetes2:~# apt-mark unhold kubelet kubectl && \
> apt-get update && apt-get install -y kubelet=1.16.3-00 kubectl=1.16.3-00 && \
> apt-mark hold kubelet kubectl
kubelet was already not hold.
kubectl was already not hold.
Hit:1 http://security.ubuntu.com/ubuntu xenial-security InRelease
Hit:2 http://us.archive.ubuntu.com/ubuntu xenial InRelease                       
Hit:3 http://us.archive.ubuntu.com/ubuntu xenial-updates InRelease
Hit:4 http://us.archive.ubuntu.com/ubuntu xenial-backports InRelease
Hit:5 https://apt.kubernetes.io kubernetes-xenial InRelease
Reading package lists... Done
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following packages will be upgraded:
    kubectl kubelet
2 upgraded, 0 newly installed, 0 to remove and 137 not upgraded.
Need to get 29.9 MB of archives.
After this operation, 3,447 kB of additional disk space will be used.
Get:1 https://apt.kubernetes.io kubernetes-xenial/main amd64 kubectl amd64 1.16.3-00 [9,233 kB]
Get:2 https://apt.kubernetes.io kubernetes-xenial/main amd64 kubelet amd64 1.16.3-00 [20.7 MB]                                                               
Fetched 29.9 MB in 32s (934 kB/s)                                                                                                                            
(Reading database ... 60808 files and directories currently installed.)
Preparing to unpack .../kubectl_1.16.3-00_amd64.deb ...
Unpacking kubectl (1.16.3-00) over (1.16.2-00) ...
Preparing to unpack .../kubelet_1.16.3-00_amd64.deb ...
Unpacking kubelet (1.16.3-00) over (1.15.5-00) ...
Setting up kubectl (1.16.3-00) ...
Setting up kubelet (1.16.3-00) ...
kubelet set on hold.
kubectl set on hold.

{% endhighlight %}

Restart the kubelet service in worker node

{% highlight console %}

root@kubernetes2:~# sudo systemctl restart kubelet

{% endhighlight %}
##### Step 5: Uncordon the worker node

Now uncordon all the pods in kubernetes2 worker onde

{% highlight console %}

vikki@kubernetes1:~$ kubectl uncordon kubernetes2
node/kubernetes2 uncordoned

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~$ kubectl get nodes
NAME STATUS ROLES AGE VERSION
kubernetes1 Ready master 41d v1.16.3
kubernetes2 Ready <none> 41d v1.16.3

{% endhighlight %}

> We can see now both the master and worker nodes are upgraded from v1.15.5 to v1.16.3

