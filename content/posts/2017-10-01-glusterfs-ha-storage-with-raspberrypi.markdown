---
#layout: post
title: Glusterfs -high available redundant storage with Raspberry pi
date: '2017-10-01 10:30:00'
tags:
- linux
- opensource
- electronics
author: Vignesh Ragupathy
comments: true
---

### Overview

This post is about how to create a high available redundant storage (Glusterfs replicated volume) from Raspberrypi and a centos server. This is just for fun project, which i am experimenting with my new raspberrypi 2 device. This is not a perfect setup, like i am using a 2 nodes replicated volume without quorom,created brick from ext3 filesystem and on root directory etc.Do not use this setup in production 🙂

### Architecture

In this i am using a wifi hotspot router, to act as a DHCP server and connected both the raspberrypi device (server1.vikki.in) using wifi adapter(Edimax 150 Mbps Wireless Nano USB Adaptor) and a laptop running 2 VM’s ( server2.vikki.in and client.vikki.in)in same wireless network (192.168.1.0)

For details about how to enable wifi interface in raspberrypi please go through the Link

### Softwares used

Ubuntu 14.04  
Centos 6.3  
Raspbian wheezy  
Glusterfs 3.7

### Hardware used

Raspberry PI Model 2 – 1GB  
Edimax 150 Mbps Wireless Nano USB Adaptor (EW-7811Un)  
Cenda T-50 Power Bank 10000 mAh  
sandisk ultra 16gb memory card  
Wifi router  
Laptop

### Installation

**Step 1 :**

Login to Raspberry pi and run the below command to install glusterfs

```bash

root@raspberrypi:~# sudo apt-get install glusterfs-server

```

**Step 2 :**

Login to the centos VM and do the following.

Download the glusterfs version 3.2.7. Since raspbian OS comes wit 3.2.7 , i am downloading the same version to avoid any conflicts.

Note : I tried a combination of version 3.2.7 and the latest version that comes with redhat EPL , but this doesn’t work out (peer probe connection failed)

```bash

root@server2]# wget -c http://bits.gluster.com/pub/gluster/glusterfs/src/glusterfs-3.2.7.tar.gz

```

Now download and install all the build dependencies

```bash

root@server2]# yum install flex automake autoconf libtool flex bison openssl-devel libxml2-devel python-devel libaio-devel libibverbs-devel librdmacm-devel readline-devel lvm2-devel glib2-devel userspace-rcu-devel libcmocka-devel libacl-devel

```

Extract the source file, navigate and do configure

```bash

[root@server2 glusterfs-3.2.7]# ./configureGlusterFS configure summary
===========================
FUSE client : yes
Infiniband verbs : yes
epoll IO multiplex : yes
argp-standalone : no
fusermount : no
readline : yes
georeplication : yes

```

And the finally make and install the gluster

```bash

[root@server2 glusterfs-3.2.7]# make
[root@server2 glusterfs-3.2.7]# make install

```
### Configuration

Login to raspberrypi and probe the centos server (server2.vikki.in)  
server1 :

```bash

root@raspberrypi:~# gluster peer probe server2.vikki.in
Probe successful

```

Check the peer status  
server1 :

```bash

root@raspberrypi:~# gluster peer status
Number of Peers: 1
Hostname: server2.vikki.in
Uuid: 0531327f-1b4a-4694-b525-58b7277472fd
State: Peer in Cluster (Connected)

```

Similarly login to the centos server and probe the raspberry pi server(server1.vikki.in)  
server2 :

```bash

root@server2 glusterfs]# gluster peer probe server2.vikki.in
Probe successful

```

server2 :

```bash

root@server2 glusterfs]# gluster peer status
Number of Peers: 1
Hostname: server1.vikki.in
Uuid: 0531327f-1b4a-4694-b525-58b7277472fe
State: Peer in Cluster (Connected)

```

I have a brick /share1 of 1GB size mounted in both raspberrypi and centos server  
Now create a replicated volume from any of the server . Here i am creating it from the raspberry pi server(server1.vikki.in)  
server1 :

```bash

root@raspberrypi:/var/log/glusterfs# gluster volume create replicated_volume replica 2 server1.vikki.in:/share1 server2.vikki.in:/share1

```

Creation of volume replicated\_volume has been successful. Please start the volume to access data.  
Now start the replicated volume  
server1 :

```bash

root@raspberrypi:/var/log/glusterfs# gluster volume start replicated_volume
Starting volume replicated_volume has been successful

```

Check the replicated volume info

```bash

[root@server2 glusterfs]# gluster volume info replicated_volumeVolume Name: replicated_volume
Type: Replicate
Status: Started
Number of Bricks: 2
Transport-type: tcp
Bricks:
Brick1: server1.vikki.in:/share1
Brick2: server2.vikki.in:/share1

```

Now the replicated volume is created . Login to the client (client.vikki.in) and mount the glusterfs volume  
Client :

```bash

[root@client ~]# mount.glusterfs server1.vikki.in:/replicated_volume /mnt/gluster/

```

The replicated volume is successfully mounted in the client

```bash

[root@client gluster]# df -h
Filesystem Size Used Avail Use% Mounted on
/dev/sda2 18G 3.5G 14G 21% /
tmpfs 495M 88K 495M 1% /dev/shm
/dev/sda1 291M 33M 244M 12% /boot
server1.vikki.in:/replica_volume
985M 18M 917M 2% /mnt/gluster

```
### Testing

create some files in gluster volume

```bash

[root@client gluster]# echo “when both nodes are running” > file1.txt
[root@client gluster]#ls
file1.txt

```

Now go to both the server (raspberrypi,centos) and check the individual brick.

```bash

[root@server1 glusterfs]# ls /share1
file1.txt
[root@server2 glusterfs]# ls /share1
file1.txt

```

Now we can see the files are replicated in both the nodes .  
Now bring down one of the server and check if the gluster volume is still accessible in client.

### My setup:
<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2017/11/pi_extra_small.jpg" class="kg-image" alt="pi_extra_small"></figure><!--kg-card-end: image-->