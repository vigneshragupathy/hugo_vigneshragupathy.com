---
#layout: post
title: Systemd – Introduction to system admin
date: '2017-10-02 11:22:00'
tags:
- linux
- opensource
author: Vignesh Ragupathy
comments: true
draft: true
---

This article is my own and based on various other sources from the internet. If you have something to say please provide your feedback in the comment section below.

### what is systemd:

systemd is a service manager/init process used to bootstrap the userspace and manage all process.  
Already systemd is the default init system for many operating systems including redhat, ubuntu, fedora and many others. Systemd is useful for a system administrator, as it provides many features to manage the OS efficiently.

### Why systemd:

Here are the few reasons why systemd is needed.  
Note: Some of the reasons below are disagreed by the developers and traditional SysV users

Speedup the boot by increasing the concurrency of process startup  
Better process management – by babysitting process  
Better dependencies management of process during startup  
Reduce computational overhead of shell script used during boot

### Systemd components:
<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2017/10/15674101381_c0ac9497e9_z.jpg" class="kg-image" alt="15674101381_c0ac9497e9_z"></figure><!--kg-card-end: image-->

How systemd increases concurrency of process start

In Linux, services can be provided by INET socket or D-bus.

### For INET socket:

Each process has dependencies. Example NFS mounts daemon waits for RPC bind.sock and portmapper IP port.  
Similarly, each daemon has its own dependencies and it may have to wait for the socket opening. Further, each daemon may have other daemon dependencies, this will further increase the wait time.

So the idea of the systemd is to start the sockets before the daemon start. Although socket has no much dependencies, we can create all the sockets for all daemon at one step. If all sockets are created then we can start all the daemons at the same time currently.

There may be wait time if a daemon needs another daemon dependency the daemon is not started, But that’s ok according to systemd.  
We still reduce the wait time of socket creation. By doing this we achieve following things

Boot time reduced  
Dependencies between service no longer exist  
Startup is parallelized  
For D bus

D-bus can also be activated using the same logic of traditional INET socket.  
Instead of starting the service at startup, we can start the first time it is accessed using bus activation.  
It also provides options for starting up provider and consumer at the same time.

### Filesystem

During system boot, there are lots of time spent waiting for filesystem jobs example: mounting, fsck, quota, quotoACL etc.  
Only after this, the kernel will start the actual services. To reduce this time spent, systemd will setup an autofs mount and start the service.  
when the filesystem finishes the quota etc it will replace by the real mount. This cannot be done for the filesystem like /,/proc where the service binaries are stored.

### How daemon escapes init by double forking

Double forking is meant to make a process orphan and making it as a child for init process(PID 1). By this way, we can daemonize a process.  
By double forking a process, it’s difficult to identify how the process is originally spawned in SysV. But systemd uses the Cgroups to keep track of the process.  
For full application servers like apache which usually spawn many child processes, it is difficult to kill the entire service. Killing the apache process sometimes will not kill all its child process.Here systemd comes to rescue which uses systemctl to easily kill all process of a service.

```bash

vikki@trinity:~$ systemctl kill httpd.service

```

Cgroups also keeps track of cpu/mem utilzation of each process. To see Cgroups cpu/memory details

```bash

vikki@trinity:~$ systemd-cgtop
Control Group Tasks %CPU Memory Input/s Output/s
/ – 12.6 3.4G – –
/init.scope 1 – – – –
/system.slice 43 – – – –
/user.slice 546 – – – –
/user.slice/user-1000.slice 546 – – – –

```

To recursively see Cgroups contents

```bash

vikki@trinity:~$ systemd-cgls
Control group /:
-.slice
├─init.scope
│ └─1 /sbin/init splash
├─system.slice
│ ├─avahi-daemon.service
│ │ ├─1015 avahi-daemon: running [trinity.local
│ │ └─1040 avahi-daemon: chroot helpe
│ ├─thermald.service
│ │ └─953 /usr/sbin/thermald –no-daemon –dbus-enable
│ ├─dbus.service
│ │ ├─ 970 /usr/bin/dbus-daemon –system –address=systemd: –nofork –nopidfile –systemd-activation
│ │ └─2530 /usr/lib/x86_64-linux-gnu/fwupd/fwupd
│ ├─uuidd.service
│ │ └─2651 /usr/sbin/uuidd –socket-activation
│ ├─ModemManager.service
│ │ └─967 /usr/sbin/ModemManager
│ ├─cron.service
│ │ └─1004 /usr/sbin/cron -f
│ ├─wpa_supplicant.service
│ │ └─1218 /sbin/wpa_supplicant -u -s -O /run/wpa_supplicant
│ ├─lightdm.service
│ │ ├─1190 /usr/sbin/lightdm
│ │ └─1268 /usr/lib/xorg/Xorg -core :0 -seat seat0 -auth /var/run/lightdm/root/:0 -nolisten tcp vt7 -novtswitch
│ ├─accounts-daemon.service
│ │ └─1014 /usr/lib/accountsservice/accounts-daemon

```

To see the time spent in system startup

```bash

vikki@trinity:~$/usr/lib/systemd/network$ systemd-analyze time
Startup finished in 6.503s (kernel) + 11.296s (userspace) = 17.799s

```

To see the time spent by each process during startup

```bash

vikki@trinity:~$/usr/lib/systemd/network$ systemd-analyze blame
7.985s postgresql@9.5-main.service
2.450s dev-sda1.device
2.149s mysql.service
1.858s vmware-tools-thinprint.service
1.630s vmware-tools.service

```

Comparison of different init system:

```bash

sysvinit	Upstart	systemd
Interfacing via D-Bus	no	yes	yes
Shell-free bootup	no	no	yes
Modular C coded early boot services included	no	no	yes
Read-Ahead	no	no[1]	yes
Socket-based Activation	no	no[2]	yes
Socket-based Activation: inetd compatibility	no	no[2]	yes
Bus-based Activation	no	no[3]	yes
Device-based Activation	no	no[4]	yes
Configuration of device dependencies with Udev rules	no	no	yes
Path-based Activation (inotify)	no	no	yes
Timer-based Activation	no	no	yes
Mount handling	no	no[5]	yes
fsck handling	no	no[5]	yes
Quota handling	no	no	yes
Automount handling	no	no	yes
Swap handling	no	no	yes
Snapshotting of system state	no	no	yes
XDG_RUNTIME_DIR Support	no	no	yes
Optionally kills remaining processes of users logging out	no	no	yes
Linux Control Groups Integration	no	no	yes
Audit record generation for started services	no	no	yes
SELinux integration	no	no	yes
PAM integration	no	no	yes
Encrypted hard disk handling (LUKS)	no	no	yes
SSL Certificate/LUKS Password handling, including Plymouth, Console, wall(1), TTY and GNOME agents	no	no	yes
Network Loopback device handling	no	no	yes
binfmt_misc handling	no	no	yes
System-wide locale handling	no	no	yes
Console and keyboard setup	no	no	yes
Infrastructure for creating, removing, cleaning up of temporary and volatile files	no	no	yes
Handling for /proc/sys sysctl	no	no	yes
Plymouth integration	no	yes	yes
Save/restore random seed	no	no	yes
Static loading of kernel modules	no	no	yes
Automatic serial console handling	no	no	yes
Unique Machine ID handling	no	no	yes
Dynamic host name and machine meta data handling	no	no	yes
Reliable termination of services	no	no	yes
Early boot /dev/log logging	no	no	yes
Minimal kmsg-based Syslog daemon for embedded use	no	no	yes
Respawning on service crash without losing connectivity	no	no	yes
Gapless service upgrades	no	no	yes
Graphical UI	no	no	yes
Built-In Profiling and Tools	no	no	yes
Instantiated services	no	yes	yes
PolicyKit integration	no	no	yes
Remote access/Cluster support built into client tools	no	no	yes
Can list all processes of a service	no	no	yes
Can identify service of a process	no	no	yes
Automatic per-service CPU cgroups to even out CPU usage between them	no	no	yes
Automatic per-user cgroups	no	no	yes
SysV compatibility	yes	yes	yes
SysV services controllable like native services	yes	no	yes
SysV-compatible /dev/initctl	yes	no	yes
Reexecution with full serialization of state	yes	no	yes
Interactive boot-up	no[6]	no[6]	yes
Container support (as advanced chroot() replacement)	no	no	yes
Dependency-based bootup	no[7]	no	yes
Disabling of services without editing files	yes	no	yes
Masking of services without editing files	no	no	yes
Robust system shutdown within PID 1	no	no	yes
Built-in kexec support	no	no	yes
Dynamic service generation	no	no	yes
Upstream support in various other OS components	yes	no	yes
Service files compatible between distributions	no	no	yes
Signal delivery to services	no	no	yes
Reliable termination of user sessions before shutdown	no	no	yes
utmp/wtmp support	yes	yes	yes
Easily writable, extensible and parseable service files, suitable for manipulation with enterprise management tools	no	no	yes

```