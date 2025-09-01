---
#layout: post
title: Backup of etcd database in kubernetes
date: '2019-11-28 16:37:26'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

Kubernetes cluster state is saved in etcd datastore. In the post we are going to see how to take a backup for etcd database in kubernetes cluster.

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/setup-7.jpg" class="kg-image"></figure><!--kg-card-end: image-->
##### Step 1: Create a directory and backup all certificates

Kubernetes cluster have all the certificates saved in the defautl path /etc/kubernetes/pki. Take the backup of all the files and save it in the backup directory

{% highlight console %}

vikki@kubernetes1:~$ mkdir backup 
vikki@kubernetes1:~$ cd backup/
{% endhighlight %}


{% highlight console %}

vikki@kubernetes1:~/backup$ sudo cp -rvf /etc/kubernetes/pki .
'/etc/kubernetes/pki' -> './pki'
'/etc/kubernetes/pki/ca.key' -> './pki/ca.key'
'/etc/kubernetes/pki/ca.crt' -> './pki/ca.crt'
'/etc/kubernetes/pki/apiserver.key' -> './pki/apiserver.key'
'/etc/kubernetes/pki/apiserver.crt' -> './pki/apiserver.crt'
'/etc/kubernetes/pki/apiserver-kubelet-client.key' -> './pki/apiserver-kubelet-client.key'
'/etc/kubernetes/pki/apiserver-kubelet-client.crt' -> './pki/apiserver-kubelet-client.crt'
'/etc/kubernetes/pki/front-proxy-ca.key' -> './pki/front-proxy-ca.key'
'/etc/kubernetes/pki/front-proxy-ca.crt' -> './pki/front-proxy-ca.crt'
'/etc/kubernetes/pki/front-proxy-client.key' -> './pki/front-proxy-client.key'
'/etc/kubernetes/pki/front-proxy-client.crt' -> './pki/front-proxy-client.crt'
'/etc/kubernetes/pki/etcd' -> './pki/etcd'
'/etc/kubernetes/pki/etcd/ca.key' -> './pki/etcd/ca.key'
'/etc/kubernetes/pki/etcd/ca.crt' -> './pki/etcd/ca.crt'
'/etc/kubernetes/pki/etcd/server.key' -> './pki/etcd/server.key'
'/etc/kubernetes/pki/etcd/server.crt' -> './pki/etcd/server.crt'
'/etc/kubernetes/pki/etcd/peer.key' -> './pki/etcd/peer.key'
'/etc/kubernetes/pki/etcd/peer.crt' -> './pki/etcd/peer.crt'
'/etc/kubernetes/pki/etcd/healthcheck-client.key' -> './pki/etcd/healthcheck-client.key'
'/etc/kubernetes/pki/etcd/healthcheck-client.crt' -> './pki/etcd/healthcheck-client.crt'
'/etc/kubernetes/pki/apiserver-etcd-client.key' -> './pki/apiserver-etcd-client.key'
'/etc/kubernetes/pki/apiserver-etcd-client.crt' -> './pki/apiserver-etcd-client.crt'
'/etc/kubernetes/pki/sa.key' -> './pki/sa.key'
'/etc/kubernetes/pki/sa.pub' -> './pki/sa.pub'
    

{% endhighlight %}
##### Step 2: Download the etcdctl binary

Download the etcdctl binary. I have created a shortlinks for the etcd-v3.2.28 which works in ubuntu16.04 and kubernetes v16.

{% highlight console %}

vikki@kubernetes1:~/backup$ wget shortlinks.vikki.in/etcd
--2019-11-26 22:05:52-- http://shortlinks.vikki.in/etcd
Resolving shortlinks.vikki.in (shortlinks.vikki.in)... 172.217.160.179, 2404:6800:4007:80d::2013
Connecting to shortlinks.vikki.in (shortlinks.vikki.in)|172.217.160.179|:80... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://github.com/vignesh88/blog/raw/master/kubernetes/etcd/etcd-v3.2.28-linux-amd64.tar.gz [following]
--2019-11-26 22:05:53-- https://github.com/vignesh88/blog/raw/master/kubernetes/etcd/etcd-v3.2.28-linux-amd64.tar.gz
Resolving github.com (github.com)... 13.234.176.102
Connecting to github.com (github.com)|13.234.176.102|:443... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://raw.githubusercontent.com/vignesh88/blog/master/kubernetes/etcd/etcd-v3.2.28-linux-amd64.tar.gz [following]
--2019-11-26 22:05:54-- https://raw.githubusercontent.com/vignesh88/blog/master/kubernetes/etcd/etcd-v3.2.28-linux-amd64.tar.gz
Resolving raw.githubusercontent.com (raw.githubusercontent.com)... 151.101.8.133
Connecting to raw.githubusercontent.com (raw.githubusercontent.com)|151.101.8.133|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 10529149 (10M) [application/octet-stream]
Saving to: ‘etcd’

etcd 100%[=============================================================================>] 10.04M 4.47MB/s in 2.2s    

2019-11-26 22:05:57 (4.47 MB/s) - ‘etcd’ saved [10529149/10529149]

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~/backup$ ls
etcd pki

{% endhighlight %}

Extract the etcd package

{% highlight console %}

vikki@kubernetes1:~/backup$ tar -xvf etcd
etcd-v3.2.28-linux-amd64/
etcd-v3.2.28-linux-amd64/etcdctl
etcd-v3.2.28-linux-amd64/etcd
etcd-v3.2.28-linux-amd64/README-etcdctl.md
etcd-v3.2.28-linux-amd64/README.md
etcd-v3.2.28-linux-amd64/Documentation/
etcd-v3.2.28-linux-amd64/Documentation/faq.md
etcd-v3.2.28-linux-amd64/Documentation/tuning.md
etcd-v3.2.28-linux-amd64/Documentation/dl_build.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-2-2-0-rc-benchmarks.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-3-demo-benchmarks.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-storage-memory-benchmark.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/_index.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/README.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-2-1-0-alpha-benchmarks.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-2-2-0-rc-memory-benchmarks.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-2-2-0-benchmarks.md
etcd-v3.2.28-linux-amd64/Documentation/benchmarks/etcd-3-watch-memory-benchmark.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/
etcd-v3.2.28-linux-amd64/Documentation/op-guide/security.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/authentication.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/recovery.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/container.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/supported-platform.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/monitoring.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/clustering.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/etcd3_alert.rules
etcd-v3.2.28-linux-amd64/Documentation/op-guide/grafana.json
etcd-v3.2.28-linux-amd64/Documentation/op-guide/_index.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/versioning.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/maintenance.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/gateway.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/runtime-configuration.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/performance.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/v2-migration.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/configuration.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/etcd-sample-grafana.png
etcd-v3.2.28-linux-amd64/Documentation/op-guide/hardware.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/grpc_proxy.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/runtime-reconf-design.md
etcd-v3.2.28-linux-amd64/Documentation/op-guide/failures.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/api_concurrency_reference_v3.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/experimental_apis.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/api_grpc_gateway.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/_index.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/interacting_v3.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/grpc_naming.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/local_cluster.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/api_reference_v3.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/limit.md
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/apispec/
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/apispec/swagger/
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/apispec/swagger/v3lock.swagger.json
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/apispec/swagger/rpc.swagger.json
etcd-v3.2.28-linux-amd64/Documentation/dev-guide/apispec/swagger/v3election.swagger.json
etcd-v3.2.28-linux-amd64/Documentation/_index.md
etcd-v3.2.28-linux-amd64/Documentation/README.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/
etcd-v3.2.28-linux-amd64/Documentation/upgrades/upgrade_3_2.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/upgrade_3_1.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/upgrading-etcd.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/_index.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/upgrade_3_4.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/upgrade_3_0.md
etcd-v3.2.28-linux-amd64/Documentation/upgrades/upgrade_3_3.md
etcd-v3.2.28-linux-amd64/Documentation/reporting_bugs.md
etcd-v3.2.28-linux-amd64/Documentation/production-users.md
etcd-v3.2.28-linux-amd64/Documentation/branch_management.md
etcd-v3.2.28-linux-amd64/Documentation/platforms/
etcd-v3.2.28-linux-amd64/Documentation/platforms/aws.md
etcd-v3.2.28-linux-amd64/Documentation/platforms/_index.md
etcd-v3.2.28-linux-amd64/Documentation/platforms/freebsd.md
etcd-v3.2.28-linux-amd64/Documentation/platforms/container-linux-systemd.md
etcd-v3.2.28-linux-amd64/Documentation/demo.md
etcd-v3.2.28-linux-amd64/Documentation/dev-internal/
etcd-v3.2.28-linux-amd64/Documentation/dev-internal/logging.md
etcd-v3.2.28-linux-amd64/Documentation/dev-internal/discovery_protocol.md
etcd-v3.2.28-linux-amd64/Documentation/dev-internal/_index.md
etcd-v3.2.28-linux-amd64/Documentation/dev-internal/release.md
etcd-v3.2.28-linux-amd64/Documentation/learning/
etcd-v3.2.28-linux-amd64/Documentation/learning/api_guarantees.md
etcd-v3.2.28-linux-amd64/Documentation/learning/glossary.md
etcd-v3.2.28-linux-amd64/Documentation/learning/why.md
etcd-v3.2.28-linux-amd64/Documentation/learning/auth_design.md
etcd-v3.2.28-linux-amd64/Documentation/learning/data_model.md
etcd-v3.2.28-linux-amd64/Documentation/learning/api.md
etcd-v3.2.28-linux-amd64/Documentation/docs.md
etcd-v3.2.28-linux-amd64/Documentation/integrations.md
etcd-v3.2.28-linux-amd64/Documentation/rfc/
etcd-v3.2.28-linux-amd64/Documentation/rfc/_index.md
etcd-v3.2.28-linux-amd64/Documentation/rfc/v3api.md
etcd-v3.2.28-linux-amd64/Documentation/metrics.md
etcd-v3.2.28-linux-amd64/READMEv2-etcdctl.md

{% endhighlight %}

Navigate to the extraced directory

{% highlight console %}

vikki@kubernetes1:~/backup$ ls
etcd etcd-v3.2.28-linux-amd64 pki

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~/backup$ cd etcd-v3.2.28-linux-amd64/

{% endhighlight %}
##### Step 3: Backup the etcd database

Now you will see a etcdctl binary inside the directy.

Use the key, certificate and CA certificate to take backup of the existing etcd database as shown below

{% highlight console %}

vikki@kubernetes1:~/backup/etcd-v3.2.28-linux-amd64$ sudo ETCDCTL_API=3 ./etcdctl --endpoints https://127.0.0.1:2379 --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key --cacert=/etc/kubernetes/pki/etcd/ca.crt snapshot save ../etc_database_backup.db
Snapshot saved at ../etc_database_backup.db

{% endhighlight %}{% highlight console %}

vikki@kubernetes1:~/backup/etcd-v3.2.28-linux-amd64$ cd ..
vikki@kubernetes1:~/backup$ ls
etcd etc_database_backup.db etcd-v3.2.28-linux-amd64 pki

{% endhighlight %}

> Now we can see the backup has been taken and saved as etc\_database\_backup.db

