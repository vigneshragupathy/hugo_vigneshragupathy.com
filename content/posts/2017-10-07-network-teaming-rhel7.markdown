---
#layout: post
title: Network teaming – RHEL7
date: '2017-10-07 11:35:00'
tags:
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

### Introduction

#### Linux Bonding driver

The Linux bonding driver provides a method for aggregating multiple network interface controllers (NICs) into a single logical bonded interface of two or more so-called (NIC) slaves. The majority of modern Linux distributions (distros) come with a Linux kernel which has the Linux bonding driver (bonding)integrated as a loadable kernel module.

We can check the bonding module by

```bash

[root@example.com ~]# lsmod |grep bonding
bonding 142537 0

```
#### Linux Teaming driver

The Linux Team driver provides an alternative to bonding driver. it has actually been designed to solve the same problem(s) using a wholly different design and different approach; an approach where special attention was paid to flexibility and efficiency. The best part is that the configuration, management, and monitoring of team driver is significantly improved with no compromise on performance, features, or throughput.The main difference is that Team driver kernel part contains only essential code and the rest of the code (link validation, LACP implementation, decision making, etc.) is run in userspace as a part of teamd daemon.

Features comparison between Bonding and Teaming  
source – redhat.com

#### Feature Bonding Team
```bash

broadcast TX policy	Yes	Yes
round-robin TX policy	Yes	Yes
active-backup TX policy	Yes	Yes
LACP (802.3ad) support	Yes	Yes
hash-based TX policy	Yes	Yes
TX load-balancing support (TLB)	Yes	Yes
VLAN support	Yes	Yes
LACP hash port select	Yes	Yes
Ethtool link monitoring	Yes	Yes
ARP link monitoring	Yes	Yes
ports up/down delays	Yes	Yes
configurable via Network Manager (gui, tui, and cli)	Yes	Yes
multiple device stacking	Yes	Yes
highly customizable hash function setup	No	Yes
D-Bus interface	No	Yes
ØMQ interface	No	Yes
port priorities and stickiness (“primary” option enhancement)	No	Yes
separate per-port link monitoring setup	No	Yes
logic in user-space	No	Yes
modular design	No	Yes
NS/NA (IPV6) link monitoring	No	Yes
load-balancing for LACP support	No	Yes
lockless TX/RX path	No	Yes
user-space runtime control	Limited	Full
multiple link monitoring setup	Limited	Yes
extensibility	Hard	Easy
performance overhead	Low	Very Low
RX load-balancing support (ALB)	Yes	Planned
RX load-balancing support (ALB) in bridge or OVS	No	Planned
Performance Analysis between Bonding and Teaming

```

source – redhat.com

```bash

Machine type: 3.3Ghz CPU (Intel), 4GB RAM
Link Type: 10GFO
Interface	Performance with64byte packets	Performance with 1KB packets	Performance with 64KB packets	Average Latency
eth0	1664.00Mb/s (27.48%CPU)	8053.53Mb/s (30.71%CPU)	9414.99Mb/s (17.08%CPU)	54.7usec
eth1	1577.44Mb/s (26.91%CPU)	7728.04Mb/s (32.23%CPU)	9329.05Mb/s (19.38%CPU)	49.3usec
bonded (eth0+eth1)	1510.13Mb/s (27.65%CPU)	7277.48Mb/s (30.07%CPU)	9414.97Mb/s (15.62%CPU)	55.5usec
teamed (eth0+eth1)	1550.15Mb/s (26.81%CPU)	7435.76Mb/s (29.56%CPU)	9413.8Mb/s (17.63%CPU)	55.5usec

```
### Migration

We can migrate the existing bond interface to a team interface.  
Bond2team is a cli tool used to convert an existing bond interface to team.  
To convert a current bond0 configuration to team ifcfg, issue a command as root:

```bash

[root@HOST1 ~]# /usr/bin/bond2team –master bond0 –rename team0

```

To convert a current bond0 configuration to team ifcfg, and to manually specify the path to the ifcfg file, issue a command as root:

```bash

[root@HOST1 ~]# /usr/bin/bond2team –master bond0 –configdir /path/to/ifcfg-file

```

It is also possible to create a team configuration by supplying the bond2team tool with a list of bonding parameters. For example:

```bash

[root@HOST1 ~]# /usr/bin/bond2team –bonding_opts “mode=1 miimon=500”

```
### Configuration – Mode:active-backup

Step 1:  
Check the available network device status

```bash

[root@HOST1 ~]# nmcli device status
DEVICE TYPE STATE CONNECTION
eth0 ethernet connected System eth0
eno1 ethernet disconnected —
eno2 ethernet disconnected —
lo loopback unmanaged —

```

Check the network connection status

```bash

[root@HOST1 ~]# nmcli connection show
NAME UUID TYPE DEVICE
System eth0 5fb06bd0-0bb0-7ffb-45f1-d6edd65f3e03 802-3-ethernet eth0

```

Step 2:  
Creating a team interface named team0 in active-backup mode

```bash

[root@HOST1 ~]# nmcli connection add con-name team0 type team ifname team0 config ‘{“runner”: {“name”: “activebackup”}}’
Connection ‘team0’ (c30dca42-cc35-4578-95c6-ae79f33b5db3) successfully added.

```

Verify the new team connection is created

```bash

[root@HOST1 ~]# nmcli connection show
NAME UUID TYPE DEVICE
team0 c30dca42-cc35-4578-95c6-ae79f33b5db3 team team0
System eth0 5fb06bd0-0bb0-7ffb-45f1-d6edd65f3e03 802-3-ethernet eth0

```

Step 3:  
Add the slave interface (eno1 and en02) and point the master to the newly created team interface team0

```bash

[root@HOST1 ~]# nmcli connection add con-name team0-sl1 type team-slave ifname eno1 master team0
Connection ‘team0-sl1’ (8d5be820-2e88-46a2-8c08-b34ec0caf8a0) successfully added.

``````bash

[root@HOST1 ~]# nmcli connection add con-name team0-sl2 type team-slave ifname eno2 master team0
Connection ‘team0-sl2’ (3372f52c-0164-49d5-9783-938df99f18bc) successfully added.

```

Verify the connection status now . we can see team masters and slaves here

```bash

[root@HOST1 ~]# nmcli connection show
NAME UUID TYPE DEVICE
team0 c30dca42-cc35-4578-95c6-ae79f33b5db3 team team0
System eth0 5fb06bd0-0bb0-7ffb-45f1-d6edd65f3e03 802-3-ethernet eth0
team0-sl2 3372f52c-0164-49d5-9783-938df99f18bc 802-3-ethernet eno2
team0-sl1 8d5be820-2e88-46a2-8c08-b34ec0caf8a0 802-3-ethernet eno1

```

Step 4:  
Now assign the IP address to the team0 interface

```bash

[root@HOST1 ~]# nmcli connection modify team0 ipv4.addresses 192.168.20.100/24 ipv4.method manual

```

Check the teaming status. Here we can see team0 interface status and active slave

```bash

[root@HOST1 ~]# teamdctl team0 state
setup:
runner: activebackup
ports:
eno1
link watches:
link summary: up
instance[link_watch_0]:
name: ethtool
link: up
eno2
link watches:
link summary: up
instance[link_watch_0]:
name: ethtool
link: up
runner:
active port: eno1

```

Step 5:  
Checking the redundancy

Now bring down the current active slave interface and check the other interface becomes active

```bash

[root@HOST1 ~]# nmcli connection down team0-sl
team0-sl1 team0-sl2

``````bash

[root@HOST1 ~]# nmcli connection down team0-sl1

``````bash

[root@HOST1 ~]# teamdctl team0 state
setup:
runner: activebackup
ports:
eno2
link watches:
link summary: up
instance[link_watch_0]:
name: ethtool
link: up
runner:
active port: eno2

```

Now we can see the active port is changed to eno2 automatically.

## Configuration – Mode:round-robin

Step 1:  
Check the network interfaces available

```bash

[root@node1 ~]# ifconfig |grep eno -A 2
eno16777728: flags=4163 mtu 1500
inet 10.0.0.21 netmask 255.255.255.0 broadcast 10.0.0.255

eno33554976: flags=4163 mtu 1500
ether 00:0c:29:9e:6f:a9 txqueuelen 1000 (Ethernet)

eno50332200: flags=4163 mtu 1500
ether 00:0c:29:9e:6f:b3 txqueuelen 1000 (Ethernet)

```

Step 2:  
Create a teaming interface with config roundrobin

```bash

[root@node1 ~]# nmcli connection add con-name team1 type team ifname team1 config ‘{“runner”: {“name”: “roundrobin”}}’
Connection ‘team1’ (ef3bc4dc-c060-4d39-865a-6c6df65d6c3d) successfully added.

```

Step 3:  
Create a slave interface and point the master to team1

```bash

[root@node1 ~]# nmcli connection add con-name slave1 type team-slave ifname eno33554976 master team1
Connection ‘slave1’ (f77e9f45-43fe-438d-9b91-9e2397b15272) successfully added. 

``````bash

[root@node1 ~]# nmcli connection add con-name slave2 type team-slave ifname eno50332200 master team1
Connection ‘slave2’ (4559604b-ffd4-4513-a3a9-b9c94ceb5108) successfully added.

```

Step 4:  
Assign IP to team1 interface

```bash

[root@node1 ~]# nmcli connection modify team1 ipv4.addresses 10.0.0.23/24 ipv4.method manual

```

Step 5:  
Check the connecton status

```bash

[root@node1 ~]# nmcli connection show
NAME UUID TYPE DEVICE
slave1 f77e9f45-43fe-438d-9b91-9e2397b15272 802-3-ethernet eno33554976
team1 ef3bc4dc-c060-4d39-865a-6c6df65d6c3d team team1
eno16777728 c0cbd7c2-b6cc-473d-919f-4a291fc72cd4 802-3-ethernet eno16777728
slave2 4559604b-ffd4-4513-a3a9-b9c94ceb5108 802-3-ethernet eno50332200

``````bash

[root@node1 ~]# teamdctl team1 state
setup:
runner: roundrobin
ports:
eno50332200
link watches:
link summary: up
instance[link_watch_0]:
name: ethtool
link: up
eno33554976
link watches:
link summary: up
instance[link_watch_0]:
name: ethtool
link: up

```
## Bandwidth analysis between individual NIC and teaming NIC (mode=round-robin)

I Used another VM(node2) with identical configuraton and followed the same steps and assined the IP 10.0.0.24 to team1 interface.

```bash

[root@node2 ~]# nmcli connection modify team1 ipv4.addresses 10.0.0.24/24 ipv4.method manual

```

Step 1:  
Installing qperf packege in both the node

```bash

[root@nodeX]# rpm -ivh qperf-0.4.9-2.el7.x86_64.rpm
warning: qperf-0.4.9-2.el7.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID fd431d51: NOKEY
Preparing… ################################# [100%]
Updating / installing…
1:qperf-0.4.9-2.el7 ################################# [100%]

```

Step 2:  
Flush the iptables in both the nodes

```bash

[root@nodeX ~]# iptables -F

```

Step 3:  
Now bringing down the teaming interface from both the nodes to check the bandwith by keeping only individual NIC

```bash

[root@node1 ~]# nmcli connection down team1

``````bash

[root@node1 ~]# nmcli connection show
NAME UUID TYPE DEVICE
slave2 4559604b-ffd4-4513-a3a9-b9c94ceb5108 802-3-ethernet —
eno16777728 c0cbd7c2-b6cc-473d-919f-4a291fc72cd4 802-3-ethernet eno16777728
team1 ef3bc4dc-c060-4d39-865a-6c6df65d6c3d team —
slave1 f77e9f45-43fe-438d-9b91-9e2397b15272 802-3-ethernet —

``````bash

[root@node2 ~]# nmcli connection down team1

``````bash

[root@node2 ~]# nmcli connection show
NAME UUID TYPE DEVICE
slave1 3d2ae74e-00b5-42d9-b531-d2950190f9de 802-3-ethernet —
team1 18b13233-eb4b-4468-8bc9-e8d8263a404b team —
eno16777728 42910ac3-a701-4f5e-b416-59c61ce1eb11 802-3-ethernet eno16777728
slave2 72061aa5-dac5-4376-b6df-34c0e5620b2e 802-3-ethernet —

```

Step 4:  
Now starting qperf in node2

```bash

[root@node2 ~]# qperf

```

Step 5:  
Now running qperf for 5 minutes to check the tcp and udp bandwidth between node 1 and node 2 .  
The IP 10.0.0.22 is assined to NIC eno16777728 of node2

```bash

[root@node1 ~]# qperf 10.0.0.22 -t 300 tcp_bw udp_bw
tcp_bw:
bw = 105 MB/sec
udp_bw:
send_bw = 55.9 MB/sec
recv_bw = 55.2 MB/sec

```

Step 6:  
Now bandwidth of individual NIC is tested, lets bring up team interface and bring down individual NIC

```bash

[root@node1 ~]# nmcli connection down eno16777728

``````bash

[root@node1 ~]# nmcli connection show
NAME UUID TYPE DEVICE
slave2 4559604b-ffd4-4513-a3a9-b9c94ceb5108 802-3-ethernet eno50332200
eno16777728 c0cbd7c2-b6cc-473d-919f-4a291fc72cd4 802-3-ethernet —
team1 ef3bc4dc-c060-4d39-865a-6c6df65d6c3d team team1
slave1 f77e9f45-43fe-438d-9b91-9e2397b15272 802-3-ethernet eno33554976

``````bash

[root@node2 ~]# nmcli connection down eno16777728

``````bash

[root@node2 ~]# nmcli connection show
NAME UUID TYPE DEVICE
slave1 3d2ae74e-00b5-42d9-b531-d2950190f9de 802-3-ethernet eno33554976
team1 18b13233-eb4b-4468-8bc9-e8d8263a404b team team1
eno16777728 42910ac3-a701-4f5e-b416-59c61ce1eb11 802-3-ethernet —
slave2 72061aa5-dac5-4376-b6df-34c0e5620b2e 802-3-ethernet eno50332200

```

Step 7:  
Starting qperf on node2

```bash

[root@node2 ~]# qperf

```

Step 8:  
Now running qperf for 5 minutes to check the tcp and udp bandwidth between node 1 and node 2 .  
The IP 10.0.0.24 is assined to team1 interface of node2

```bash

[root@node1 ~]# qperf 10.0.0.24 -t 300 tcp_bw udp_bw
tcp_bw:
bw = 108 MB/sec
udp_bw:
send_bw = 51.5 MB/sec
recv_bw = 51 MB/sec

```

Now we can see the bandwith between individual NIC and team interface is almost same.

