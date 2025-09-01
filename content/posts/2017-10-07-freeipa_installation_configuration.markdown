---
#layout: post
title: FreeIPA Installation and configuration
date: '2017-10-07 11:58:00'
tags:
- linux
- opensource
author: Vignesh Ragupathy
comments: true
---

I worked on a freelance project a year ago which gives me experience in Free IPA server. Here I am sharing some portion of the setup used.It would be useful for beginners trying to setup Free IPA server.

I have 2 sections here. One is about FreeIPA on the normal server and the other is FreeIPA in Docker container.

If you have any questions & comments, feel free to add in the Disqus comment section below

FreeIPA stands for Free Identity, Policy, Audit. It is an open source alternative to AD that combines LDAP, Kerberos, CA services and management tools, and ships with its own schemas. It is a solution for managing users, groups, hosts, services, DNS, NTP etc.

### Hostname used:

IPA server name: `freeipa.vikki.in`  
IPA client name: `client01.vikki.in` (should be under the same domain e.g.: xxx.vikki.in)  
Docker host machine: `fedora25.vikki.in`

##### FreeIPA server Installation and Configuration

_Step 1: Set fully qualified hostname_

{% highlight console %}

#vim /etc/hostname
freeipa.vikki.in

{% endhighlight %}

_Step 2: Set local resolver for the hostname_

{% highlight console %}

#vim /etc/hosts
10.0.0.1 freeipa.vikki.in freeipa

{% endhighlight %}

_Step 3: Disable selinux(optional)_

{% highlight console %}

#vim /etc/sysconfig/selinux
SELINUX=disabled

{% endhighlight %}

_Step 4: Reboot server_

{% highlight console %}

# reboot

{% endhighlight %}

_Step 5: Verify hostname and selinux_

{% highlight console %}

#hostname
freeipa.vikki.in
#getenforce
    Disabled

{% endhighlight %}

_Step 6: Install ipa server_

{% highlight console %}

# yum install -y ipa-server bind bind-dyndb-ldap ipa-server-dns

{% endhighlight %}

_Step 7: Configure FreeIPA_

If you have a separate DNS server for managing the domain remove the option(--setup-dns)

{% highlight console %}

# ipa-server-install --setup-dns
Existing BIND configuration detected, overwrite? [no]: yes
Enter the fully qualified domain name of the computer
on which you're setting up server software. Using the form
<hostname>.<domainname>
Example: master.example.com.
Server host name [freeipa.vikki.in]: freeipa.vikki.in
Please confirm the domain name [vikki.in]: vikki.in
Please provide a realm name [VIKKI.IN]: VIKKI.IN
Directory Manager password:
Password (confirm):
IPA admin password:
Password (confirm):
Do you want to configure DNS forwarders? [yes]: yes
Enter the IP address of DNS forwarder to use, or press Enter to finish.
Enter IP address for a DNS forwarder: 8.8.8.8
DNS forwarder 8.8.8.8 added
Enter IP address for a DNS forwarder: 8.8.4.4
DNS forwarder 8.8.4.4 added
Enter IP address for a DNS forwarder: <enter>
Do you want to configure the reverse zone? [yes]: yes
Please specify the reverse zone name [0.0.10.in-addr.arpa.]: 0.0.10.in-addr.arpa
Using reverse zone 0.0.10.in-addr.arpa.
The IPA Master Server will be configured with:
Hostname: freeipa.vikki.in
IP address: 10.0.0.1
Domain name: vikki.in
Realm name: VIKKI.IN
BIND DNS server will be configured to serve IPA domain with:
Forwarders: 8.8.8.8, 8.8.4.4
Reverse zone: 0.0.10.in-addr.arpa.
Continue to configure the system with these values? [no]: yes
The following operations may take some minutes to complete.
Please wait until the prompt is returned.
Configuring NTP daemon (ntpd)
[1/4]: stopping ntpd
[2/4]: writing configuration
[3/4]: configuring ntpd to start on boot
[4/4]: starting ntpd
Done configuring NTP daemon (ntpd).
Configuring directory server (dirsrv). Estimated time: 1 minute
[1/42]: creating directory server user
[2/42]: creating directory server instance
[3/42]: adding default schema
[4/42]: enabling memberof plugin
[5/42]: enabling winsync plugin
[6/42]: configuring replication version plugin
[7/42]: enabling IPA enrollment plugin
[8/42]: enabling ldapi
[9/42]: configuring uniqueness plugin
[10/42]: configuring uuid plugin
[11/42]: configuring modrdn plugin
[12/42]: configuring DNS plugin
[13/42]: enabling entryUSN plugin
[14/42]: configuring lockout plugin
[15/42]: creating indices
[16/42]: enabling referential integrity plugin
[17/42]: configuring certmap.conf
[18/42]: configure autobind for root
[19/42]: configure new location for managed entries
[20/42]: configure dirsrv ccache
[21/42]: enable SASL mapping fallback
[22/42]: restarting directory server
[23/42]: adding default layout
[24/42]: adding delegation layout
[25/42]: creating container for managed entries
[26/42]: configuring user private groups
[27/42]: configuring netgroups from hostgroups
[28/42]: creating default Sudo bind user
[29/42]: creating default Auto Member layout
[30/42]: adding range check plugin
[31/42]: creating default HBAC rule allow_all
[32/42]: adding entries for topology management
[33/42]: initializing group membership
[34/42]: adding master entry
[35/42]: initializing domain level
[36/42]: configuring Posix uid/gid generation
[37/42]: adding replication acis
[38/42]: enabling compatibility plugin
[39/42]: activating sidgen plugin
[40/42]: activating extdom plugin
[41/42]: tuning directory server
[42/42]: configuring directory to start on boot
Done configuring directory server (dirsrv).
Configuring certificate server (pki-tomcatd). Estimated time: 3 minutes 30 seconds
[1/27]: creating certificate server user
[2/27]: configuring certificate server instance
[3/27]: stopping certificate server instance to update CS.cfg
[4/27]: backing up CS.cfg
[5/27]: disabling nonces
[6/27]: set up CRL publishing
[7/27]: enable PKIX certificate path discovery and validation
[8/27]: starting certificate server instance
[9/27]: creating RA agent certificate database
[10/27]: importing CA chain to RA certificate database
[11/27]: fixing RA database permissions
[12/27]: setting up signing cert profile
[13/27]: setting audit signing renewal to 2 years
[14/27]: restarting certificate server
[15/27]: requesting RA certificate from CA
[16/27]: issuing RA agent certificate
[17/27]: adding RA agent as a trusted user
[18/27]: authorizing RA to modify profiles
[19/27]: configure certmonger for renewals
[20/27]: configure certificate renewals
[21/27]: configure RA certificate renewal
[22/27]: configure Server-Cert certificate renewal
[23/27]: Configure HTTP to proxy connections
[24/27]: restarting certificate server
[25/27]: migrating certificate profiles to LDAP
[26/27]: importing IPA certificate profiles
[27/27]: adding default CA ACL
Done configuring certificate server (pki-tomcatd).
Configuring directory server (dirsrv). Estimated time: 10 seconds
[1/3]: configuring ssl for ds instance
[2/3]: restarting directory server
[3/3]: adding CA certificate entry
Done configuring directory server (dirsrv).
Configuring Kerberos KDC (krb5kdc). Estimated time: 30 seconds
[1/10]: adding sasl mappings to the directory
[2/10]: adding kerberos container to the directory
[3/10]: configuring KDC
[4/10]: initialize kerberos container
[5/10]: adding default ACIs
[6/10]: creating a keytab for the directory
[7/10]: creating a keytab for the machine
[8/10]: adding the password extension to the directory
[9/10]: starting the KDC
[10/10]: configuring KDC to start on boot
Done configuring Kerberos KDC (krb5kdc).
Configuring kadmin
[1/2]: starting kadmin
[2/2]: configuring kadmin to start on boot
Done configuring kadmin.
Configuring ipa_memcached
[1/2]: starting ipa_memcached
[2/2]: configuring ipa_memcached to start on boot
Done configuring ipa_memcached.
Configuring ipa-otpd
[1/2]: starting ipa-otpd
[2/2]: configuring ipa-otpd to start on boot
Done configuring ipa-otpd.
Configuring the web interface (httpd). Estimated time: 1 minute
[1/19]: setting mod_nss port to 443
[2/19]: setting mod_nss protocol list to TLSv1.0 - TLSv1.2
[3/19]: setting mod_nss password file
[4/19]: enabling mod_nss renegotiate
[5/19]: adding URL rewriting rules
[6/19]: configuring httpd
[7/19]: configure certmonger for renewals
[8/19]: setting up ssl
[9/19]: importing CA certificates from LDAP
[10/19]: setting up browser autoconfig
[11/19]: publish CA cert
[12/19]: creating a keytab for httpd
[13/19]: clean up any existing httpd ccache
[14/19]: configuring SELinux for httpd
[15/19]: create KDC proxy user
[16/19]: create KDC proxy config
[17/19]: enable KDC proxy
[18/19]: restarting httpd
[19/19]: configuring httpd to start on boot
Done configuring the web interface (httpd).
Applying LDAP updates
Upgrading IPA:
[1/9]: stopping directory server
[2/9]: saving configuration
[3/9]: disabling listeners
[4/9]: enabling DS global lock
[5/9]: starting directory server
[6/9]: upgrading server
[7/9]: stopping directory server
[8/9]: restoring configuration
[9/9]: starting directory server
Done.
Restarting the directory server
Restarting the KDC
Configuring DNS (named)
[1/12]: generating rndc key file
WARNING: Your system is running out of entropy, you may experience long delays
[2/12]: adding DNS container
[3/12]: setting up our zone
[4/12]: setting up reverse zone
[5/12]: setting up our own record
[6/12]: setting up records for other masters
[7/12]: adding NS record to the zones
[8/12]: setting up CA record
[9/12]: setting up kerberos principal
[10/12]: setting up named.conf
[11/12]: configuring named to start on boot
[12/12]: changing resolv.conf to point to ourselves
Done configuring DNS (named).
Configuring DNS key synchronization service (ipa-dnskeysyncd)
[1/7]: checking status
[2/7]: setting up bind-dyndb-ldap working directory
[3/7]: setting up kerberos principal
[4/7]: setting up SoftHSM
[5/7]: adding DNSSEC containers
[6/7]: creating replica keys
[7/7]: configuring ipa-dnskeysyncd to start on boot
Done configuring DNS key synchronization service (ipa-dnskeysyncd).
Restarting ipa-dnskeysyncd
Restarting named
Restarting the web server
==============================================================================
Setup complete
Next steps:
1. You must make sure these network ports are open:
TCP Ports:
* 80, 443: HTTP/HTTPS
* 389, 636: LDAP/LDAPS
* 88, 464: kerberos
* 53: bind
UDP Ports:
* 88, 464: kerberos
* 53: bind
* 123: ntp
2. You can now obtain a kerberos ticket using the command: 'kinit admin'
This ticket will allow you to use the IPA tools (e.g., ipa user-add)
and the web user interface.
Be sure to back up the CA certificate stored in /root/cacert.p12
This file is required to create replicas. The password for this
file is the Directory Manager password

{% endhighlight %}

_Step 8: Configure firewall_

{% highlight console %}

#firewall-cmd --permanent --add-service=ntp
#firewall-cmd --permanent --add-service=http
#firewall-cmd --permanent --add-service=https
#firewall-cmd --permanent --add-service=ldap
#firewall-cmd --permanent --add-service=ldaps
#firewall-cmd --permanent --add-service=kerberos
#firewall-cmd --permanent --add-service=kpasswd

{% endhighlight %}

Either add all the above rules in firewall or simply flush all rules from iptables(not recommended in production)

{% highlight console %}

# iptables -F

{% endhighlight %}

_Step 9: Get Kerberos tickets_  
Now the FreeIPA server is ready , we should generate the kerberos ticket with admin privilege. This kerberos ticket is needed to run any IPA commands in server with full privileges and to connect web UI.

Kerberos provides authentication services for entire FreeIPA components.

{% highlight console %}

#kinit admin
Password for admin@VIKKI.IN:# IPA admin password

{% endhighlight %}

We can also view the current Kerberos ticket with expiry details using the klist command. The default expiry period is 24hours.

{% highlight console %}

# klist
Ticket cache: KEYRING:persistent:0:0
Default principal: admin@VIKKI.IN
Valid starting Expires Service principal
08/09/2016 14:45:53 11/09/2016 14:45:50 krbtgt/ADMIN@VIKKI.IN

{% endhighlight %}

_step 10: Enabled home directory and default shell_  
We have to enable the home directory creation and default login shell for the new user login. Run the below command to set it.

{% highlight console %}

# ipa config-mod --defaultshell=/bin/bash
# authconfig --enablemkhomedir --update

{% endhighlight %}

_Step 11: Login to freeipa web_  
Login to the freeIPA server from the browser and create some users.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2018/01/Screenshot-from-2018-01-19-18-40-38.png" class="kg-image" alt="Screenshot-from-2018-01-19-18-40-38"></figure><!--kg-card-end: image-->

_Step 12: Add dns entry for the IPA client_  
Now the user has been created , we can configure the dns record for the new clients to be added under domain vikki.in

{% highlight console %}

# ipa dnsrecord-add vikki.in client01 --a-rec 10.0.0.2
IPA Client

{% endhighlight %}
##### FreeIPA client Installation and Configuration

_Step 1: Freeipa client preparation_

Set hostname “client01.vikki.in”  
Disable “selinux”  
Disable “Firewall”  
For all the above follow the same procedure followed in FreeIPA server preparation

_Step 2: Set DNS server IP to FreeIPA server_

{% highlight console %}

# vim /etc/resolv.conf
nameserver 10.0.0.1
#dig client01.vikki.in

{% endhighlight %}

_Step 3: Install ipa client_

{% highlight console %}

# yum -y install ipa-client
Discovery was successful!
Hostname: client01.vikki.in
Realm: VIKKI.IN
DNS Domain: vikki.in
IPA Server: freeipa.vikki.in
BaseDN: dc=vikki,dc=in
# confirm settings and proceed with "yes"
Continue to configure the system with these values? [no]: yes
# answer with admin
User authorized to enroll computers: admin
Synchronizing time with KDC...
Unable to sync time with IPA NTP server, assuming the time is in sync. Please check that 123 UDP port is opened.
Password for admin@vikki.in:
Successfully retrieved CA cert
Subject: CN=Certificate Authority,O=vikki.in
Issuer: CN=Certificate Authority,O=vikki.in
Valid From: Fri Mar 20 01:42:15 2015 UTC
Valid Until: Tue Mar 20 01:42:15 2035 UTC
Enrolled in IPA realm VIKKI.IN
.....
.....
Configured /etc/ssh/ssh_config
Configured /etc/ssh/sshd_config
Client configuration complete.

{% endhighlight %}

_Step 4: Try to login using the user created from the FreeIPA server GUI_

{% highlight console %}

# ssh vivek@client01.vikki.in
Password: 
Password expired. Change your password now.
Current Password: 
New password: 
Retype new password:
Creating home directory for vivek.
Last login: Fri Jan 19 18:44:31 2018 from localhost
#

{% endhighlight %}{% highlight console %}

# pwd
/home/vivek

{% endhighlight %}

If you have not enabled the home directory creation and login shell , you will get the below output.

{% highlight console %}

# ssh vivek@client01.vikki.in
Password: 
Password expired. Change your password now.
Current Password: 
New password: 
Retype new password: 
Could not chdir to home directory /home/vivek: No such file or directory
-sh-4.2$ 
    

{% endhighlight %}
##### FreeIPA in Docker container

FreeIPA is also available as a docker container. We can download the FreeIPA repository from github [master.zip](https://github.com/freeipa/freeipa-container/archive/master.zip).

#### How to build FreeIPA docker container

Download the zip file, extract it , go inside the directory and run the docker build.

This repository has "Dockerfile" which supports many operation system, use the one you required. Here i am installing the container in Fedora27 , so i passing the respective dockerfile using "-f" option.

{% highlight console %}

[root@fedora25 freeipa-container-master]# docker build -t freeipa-server -f Dockerfile.fedora-27 .
Sending build context to Docker daemon 161.3 kB
Step 1/45 : FROM registry.fedoraproject.org/fedora:27
Trying to pull repository registry.fedoraproject.org/fedora ... 
sha256:44be9569d32fee1846afd1d17dc681c2b8f1f2b367764194ade32d9bfdf1984f: Pulling from registry.fedoraproject.org/fedora
178a618c1fcb: Pull complete 
Digest: sha256:44be9569d32fee1846afd1d17dc681c2b8f1f2b367764194ade32d9bfdf1984f
Status: Downloaded newer image for registry.fedoraproject.org/fedora:27
  ---> 9881e4229c95
Step 2/45 : MAINTAINER Jan Pazdziora
  ---> Running in 4ccc52e61959
  ---> e6203b4f193f
Removing intermediate container 4ccc52e61959
Step 3/45 : RUN groupadd -g 288 kdcproxy ; useradd -u 288 -g 288 -c 'IPA KDC Proxy User' -d '/var/lib/kdcproxy' -s '/sbin/nologin' kdcproxy
  ---> Running in 281bede2e1ca
  ---> 11f29258686a
Removing intermediate container 281bede2e1ca
Step 4/45 : RUN groupadd -g 289 ipaapi; useradd -u 289 -g 289 -c 'IPA Framework User' -d / -s '/sbin/nologin' ipaapi
  ---> Running in acff04c732af
useradd: warning: the home directory already exists.
Not copying any file from skel directory into it.
  ---> 9100a9565039
Removing intermediate container acff04c732af
Step 5/45 : RUN mkdir -p /run/lock && dnf upgrade -y && dnf install -y freeipa-server freeipa-server-dns freeipa-server-trust-ad initscripts && dnf clean all
  ---> Running in b33a6dd071aa
Fedora 27 - x86_64 - Updates 3.2 MB/s | 16 MB 00:05    
Fedora 27 - x86_64 3.0 MB/s | 58 MB 00:19    
Last metadata expiration check: 0:00:06 ago on Sat Jan 20 06:40:05 2018.
Dependencies resolved.
================================================================================
  Package Arch Version Repository Size
================================================================================
Upgrading:
  gdbm x86_64 1:1.13-6.fc27 updates 158 k

Transaction Summary
================================================================================
Upgrade 1 Package

Total download size: 158 k
Downloading Packages:
gdbm-1.13-6.fc27.x86_64.rpm 198 kB/s | 158 kB 00:00    
--------------------------------------------------------------------------------
Total 72 kB/s | 158 kB 00:02     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Preparing : 1/1 
  Upgrading : gdbm-1:1.13-6.fc27.x86_64 1/2 
  Running scriptlet: gdbm-1:1.13-6.fc27.x86_64 1/2 
  Cleanup : gdbm-1.14-1.fc27.x86_64 2/2 
  Running scriptlet: gdbm-1.14-1.fc27.x86_64 2/2 
  Verifying : gdbm-1:1.13-6.fc27.x86_64 1/2 
  Verifying : gdbm-1.14-1.fc27.x86_64 2/2 

Upgraded:
  gdbm.x86_64 1:1.13-6.fc27                                                     

Complete!
Last metadata expiration check: 0:00:38 ago on Sat Jan 20 06:40:05 2018.
Dependencies resolved.
================================================================================
  Package Arch Version Repository
                                                                            Size
================================================================================
Installing:
  freeipa-server x86_64 4.6.1-3.fc27 fedora 398 k
  freeipa-server-dns noarch 4.6.1-3.fc27 fedora 60 k
  freeipa-server-trust-ad x86_64 4.6.1-3.fc27 fedora 152 k
  initscripts x86_64 9.79-1.fc27 updates 394 k
Installing dependencies:
  389-ds-base x86_64 1.3.7.8-1.fc27 updates 1.8 M
  389-ds-base-libs x86_64 1.3.7.8-1.fc27 updates 744 k
  GeoIP x86_64 1.6.11-3.fc27 fedora 124 k
  GeoIP-GeoLite-data noarch 2018.01-1.fc27 updates 465 k
  timedatex x86_64 0.4-5.fc27 fedora 30 k

Transaction Summary
================================================================================
Install 416 Packages

Total download size: 184 M
Installed size: 568 M
Downloading Packages:
(1/416): freeipa-server-dns-4.6.1-3.fc27.noarch 103 kB/s | 60 kB 00:00    
(2/416): freeipa-server-trust-ad-4.6.1-3.fc27.x 208 kB/s | 152 kB 00:00    
(3/416): cyrus-sasl-gssapi-2.1.26-34.fc27.x86_6 286 kB/s | 46 kB 00:00    
(4/416): freeipa-server-4.6.1-3.fc27.x86_64.rpm 365 kB/s | 398 kB 00:01    
(5/416): freeipa-client-4.6.1-3.fc27.x86_64.rpm 441 kB/s | 159 kB 00:00    
(415/416): linux-atm-libs-2.5.1-19.fc27.x86_64. 154 kB/s | 40 kB 00:00    
(416/416): libicu-57.1-9.fc27.x86_64.rpm 862 kB/s | 8.4 MB 00:09    
--------------------------------------------------------------------------------
Total 2.0 MB/s | 184 MB 01:30     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Running scriptlet: copy-jdk-configs-3.3-2.fc27.noarch 1/1 
  Running scriptlet: pki-base-10.5.1-1.fc27.noarch 1/1 
  Running scriptlet: java-1.8.0-openjdk-headless-1:1.8.0.151-1.b12.fc27.x 1/1 
  Preparing : 1/1 
  Installing : perl-Exporter-5.72-395.fc27.noarch 1/416 
  Installing : perl-libs-4:5.26.1-402.fc27.x86_64 2/416 
  Running scriptlet: perl-libs-4:5.26.1-402.fc27.x86_64                   
  Installing : freetype-2.8-7.fc27.x86_64 215/416 
  Running scriptlet: opendnssec-1.4.14-1.fc27.x86_64 216/416 
  Installing : opendnssec-1.4.14-1.fc27.x86_64 216/416 
  Running scriptlet: opendnssec-1.4.14-1.fc27.x86_64 216/416 
The token has been initialized and is reassigned to slot 1739892472
INFO: The XML in /etc/opendnssec/conf.xml is valid
INFO: The XML in /etc/opendnssec/zonelist.xml is valid
INFO: The XML in /etc/opendnssec/kasp.xml is valid
WARNING: In policy default, Y used in duration field for Keys/KSK Lifetime (P1Y) in /etc/opendnssec/kasp.xml - this will be interpreted as 365 days
WARNING: In policy lab, Y used in duration field for Keys/KSK Lifetime (P1Y) in /etc/opendnssec/kasp.xml - this will be interpreted as 365 days
*WARNING* This will erase all data in the database; are you sure? [y/N] fixing permissions on file /var/opendnssec/kasp.db
zonelist filename set to /etc/opendnssec/zonelist.xml.
kasp filename set to /etc/opendnssec/kasp.xml.
Repository SoftHSM found
No Maximum Capacity set.
RequireBackup NOT set; please make sure that you know the potential problems of using keys which are not recoverable
Policy default found
Info: converting P1Y to seconds; M interpreted as 31 days, Y interpreted as 365 days
Policy lab found
Info: converting P1Y to seconds; M interpreted as 31 days, Y interpreted as 365 days
  Installing : net-tools-2.0-0.45.20160912git.fc27.x86_64 416/416 
  Running scriptlet: libsss_sudo-1.16.0-5.fc27.x86_64 416/416Failed to connect to bus: No such file or directory
  
  Verifying : freeipa-server-4.6.1-3.fc27.x86_64 1/416 
  Verifying : freeipa-server-dns-4.6.1-3.fc27.noarch 2/416 
  Verifying : freeipa-server-trust-ad-4.6.1-3.fc27.x86_64 3/416 
  Verifying : cyrus-sasl-gssapi-2.1.26-34.fc27.x86_64              
  Verifying : lua-posix-33.3.1-7.fc27.x86_64 415/416 
  Verifying : perl-libnet-3.11-1.fc27.noarch 416/416 

Installed:
  freeipa-server.x86_64 4.6.1-3.fc27                                            
  freeipa-server-dns.noarch 4.6.1-3.fc27                                        
  freeipa-server-trust-ad.x86_64 4.6.1-3.fc27                                   
                                            
  xsom.noarch 0-17.20110809svn.fc27                                             

Complete!
Non-fatal <unknown> scriptlet failure in rpm package nfs-utils
Non-fatal <unknown> scriptlet failure in rpm package nfs-utils
Non-fatal <unknown> scriptlet failure in rpm package nfs-utils
Non-fatal <unknown> scriptlet failure in rpm package nfs-utils
Non-fatal POSTIN scriptlet failure in rpm package freeipa-server-trust-ad
Non-fatal POSTIN scriptlet failure in rpm package freeipa-server-trust-ad
18 files removed
  ---> 8e5982e4aba2
Removing intermediate container b33a6dd071aa
Step 6/45 : RUN sed -i '/installutils.verify_fqdn(config.master_host_name, options.no_host_dns)/s/)/, local_hostname=False)/' /usr/lib/python2.7/site-packages/ipaserver/install/server/replicainstall.py && python -m compileall /usr/lib/python2.7/site-packages/ipaserver/install/server/replicainstall.py
  ---> Running in 3f16baa3e82f
Compiling /usr/lib/python2.7/site-packages/ipaserver/install/server/replicainstall.py ...
  ---> 907bee58561a
Removing intermediate container 3f16baa3e82f
Step 7/45 : RUN sed -i '/installutils.verify_fqdn(config.master_host_name, options.no_host_dns)/s/)/, local_hostname=False)/' /usr/lib/python3.6/site-packages/ipaserver/install/server/replicainstall.py && python3 -m compileall /usr/lib/python3.6/site-packages/ipaserver/install/server/replicainstall.py
  ---> Running in c33cb158b26c
Compiling '/usr/lib/python3.6/site-packages/ipaserver/install/server/replicainstall.py'...
  ---> 0a6e9da4fd27
Removing intermediate container c33cb158b26c
Step 8/45 : RUN [-L /etc/systemd/system/syslog.service] && ! [-f /etc/systemd/system/syslog.service] && rm -f /etc/systemd/system/syslog.service
  ---> Running in d7ef9f4d9b2a
  ---> 9980910fa2dc
Removing intermediate container d7ef9f4d9b2a
Step 9/45 : RUN find /etc/systemd/system/* '!' -name '*.wants' | xargs rm -rvf
  ---> Running in 594660eda1bc
removed '/etc/systemd/system/basic.target.wants/dnf-makecache.timer'
removed '/etc/systemd/system/console-getty.service'
removed '/etc/systemd/system/dbus-org.freedesktop.timedate1.service'
removed '/etc/systemd/system/default.target'
removed '/etc/systemd/system/dev-hugepages.mount'
removed '/etc/systemd/system/getty.target'
removed '/etc/systemd/system/getty.target.wants/getty@tty1.service'
removed directory '/etc/systemd/system/httpd.d'
removed '/etc/systemd/system/local-fs.target.wants/fedora-readonly.service'
removed '/etc/systemd/system/multi-user.target.wants/remote-fs.target'
removed '/etc/systemd/system/multi-user.target.wants/auditd.service'
removed '/etc/systemd/system/multi-user.target.wants/nfs-client.target'
removed '/etc/systemd/system/multi-user.target.wants/sssd.service'
removed '/etc/systemd/system/remote-fs.target.wants/nfs-client.target'
removed '/etc/systemd/system/sockets.target.wants/sssd-secrets.socket'
removed '/etc/systemd/system/sys-fs-fuse-connections.mount'
removed '/etc/systemd/system/sysinit.target.wants/fedora-import-state.service'
removed '/etc/systemd/system/systemd-logind.service'
removed '/etc/systemd/system/systemd-remount-fs.service'
removed '/etc/systemd/system/systemd-timedated.service'
  ---> 6273c3ce8454
Removing intermediate container 594660eda1bc
Step 10/45 : RUN for i in basic.target network.service netconsole.service ; do rm -f /usr/lib/systemd/system/$i && ln -s /dev/null /usr/lib/systemd/system/$i ; done
  ---> Running in 3805f0460b62
  ---> a82df26e2086
Removing intermediate container 3805f0460b62
Step 11/45 : RUN rm -fv /usr/lib/systemd/system/sysinit.target.wants/*
  ---> Running in 2340c6e904de
removed '/usr/lib/systemd/system/sysinit.target.wants/cryptsetup.target'
removed '/usr/lib/systemd/system/sysinit.target.wants/dev-hugepages.mount'
removed '/usr/lib/systemd/system/sysinit.target.wants/dev-mqueue.mount'
removed '/usr/lib/systemd/system/sysinit.target.wants/ldconfig.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/proc-sys-fs-binfmt_misc.automount'
removed '/usr/lib/systemd/system/sysinit.target.wants/sys-fs-fuse-connections.mount'
removed '/usr/lib/systemd/system/sysinit.target.wants/sys-kernel-config.mount'
removed '/usr/lib/systemd/system/sysinit.target.wants/sys-kernel-debug.mount'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-ask-password-console.path'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-binfmt.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-firstboot.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-journal-catalog-update.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-journal-flush.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-journald.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-machine-id-commit.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-sysctl.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-sysusers.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-tmpfiles-setup.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-update-done.service'
removed '/usr/lib/systemd/system/sysinit.target.wants/systemd-update-utmp.service'
  ---> e575744cbec4
Removing intermediate container 2340c6e904de
Step 12/45 : RUN echo 'disable *' > /usr/lib/systemd/system-preset/10-container-disable.preset
  ---> Running in c2c372a783c6
  ---> afbb3fa9de01
Removing intermediate container c2c372a783c6
Step 13/45 : RUN /sbin/ldconfig -X
  ---> Running in d4e981ba0dae
  ---> 18cde0edd362
Removing intermediate container d4e981ba0dae
Step 14/45 : COPY init-data /usr/local/sbin/init
  ---> e3cf2eac153f
Removing intermediate container b5a7b4f89ee8
Step 15/45 : COPY ipa-server-configure-first ipa-server-status-check exit-with-status ipa-volume-upgrade-* /usr/sbin/
  ---> c60a71108eda
Removing intermediate container b38588e0eecc
Step 16/45 : COPY install.sh uninstall.sh /bin/
  ---> d208c2ad0dea
Removing intermediate container 633df7d21612
Step 17/45 : RUN mv /bin/hostnamectl /bin/hostnamectl.orig
  ---> Running in d84b0e146325
  ---> 41a46d7a76d0
Removing intermediate container d84b0e146325
Step 18/45 : RUN mv /usr/bin/domainname /usr/bin/domainname.orig
  ---> Running in 808c9796831e
  ---> bdd853c871b6
Removing intermediate container 808c9796831e
Step 19/45 : ADD hostnamectl-wrapper /bin/hostnamectl
  ---> f34600ec54fd
Removing intermediate container f6f3c216ffd4
Step 20/45 : ADD hostnamectl-wrapper /usr/bin/domainname
  ---> 49fb7d34f8af
Removing intermediate container 3c3c1695eb37
Step 21/45 : RUN chmod -v +x /usr/local/sbin/init /usr/sbin/ipa-server-configure-first /usr/sbin/ipa-server-status-check /usr/sbin/exit-with-status /usr/sbin/ipa-volume-upgrade-* /bin/install.sh /bin/uninstall.sh /bin/hostnamectl /usr/bin/domainname
  ---> Running in c322618dc805
mode of '/usr/local/sbin/init' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-server-configure-first' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-server-status-check' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/exit-with-status' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-volume-upgrade-0.5-0.6' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-volume-upgrade-0.5-1.0' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-volume-upgrade-0.5-1.1' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-volume-upgrade-0.6-1.0' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-volume-upgrade-0.6-1.1' retained as 0755 (rwxr-xr-x)
mode of '/usr/sbin/ipa-volume-upgrade-1.0-1.1' retained as 0755 (rwxr-xr-x)
mode of '/bin/install.sh' retained as 0755 (rwxr-xr-x)
mode of '/bin/uninstall.sh' retained as 0755 (rwxr-xr-x)
mode of '/bin/hostnamectl' retained as 0755 (rwxr-xr-x)
mode of '/usr/bin/domainname' retained as 0755 (rwxr-xr-x)
  ---> 0395279a17e5
Removing intermediate container c322618dc805
Step 22/45 : COPY container-ipa.target ipa-server-configure-first.service ipa-server-upgrade.service ipa-server-update-self-ip-address.service /usr/lib/systemd/system/
  ---> b9a4d37d8af7
Removing intermediate container 8218605ec53b
Step 23/45 : RUN rmdir -v /etc/systemd/system/multi-user.target.wants && mkdir /etc/systemd/system/container-ipa.target.wants && ln -s /etc/systemd/system/container-ipa.target.wants /etc/systemd/system/multi-user.target.wants
  ---> Running in d5554f6b4498
rmdir: removing directory, '/etc/systemd/system/multi-user.target.wants'
  ---> ca9aaf468af8
Removing intermediate container d5554f6b4498
Step 24/45 : RUN systemctl set-default container-ipa.target
  ---> Running in 2b40be183177
Created symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/container-ipa.target.
  ---> 3d9f7251ef3d
Removing intermediate container 2b40be183177
Step 25/45 : RUN systemctl enable ipa-server-configure-first.service
  ---> Running in 6a7badce6e3e
Created symlink /etc/systemd/system/container-ipa.target.wants/ipa-server-configure-first.service → /usr/lib/systemd/system/ipa-server-configure-first.service.
  ---> 74059555138d
Removing intermediate container 6a7badce6e3e
Step 26/45 : COPY exit-via-chroot.conf /usr/lib/systemd/system/systemd-poweroff.service.d/
  ---> 6f481582dd11
Removing intermediate container d704db80e37d
Step 27/45 : COPY atomic-install-help /usr/share/ipa/
  ---> 7f31c6a39572
Removing intermediate container 19f606e9e0bc
Step 28/45 : COPY volume-data-list volume-data-mv-list volume-data-autoupdate /etc/
  ---> b9c4aa387aa4
Removing intermediate container ca6ce5b07075
Step 29/45 : RUN set -e ; cd / ; mkdir /data-template ; cat /etc/volume-data-list | while read i ; do echo $i ; if [-e $i] ; then tar cf - .$i | ( cd /data-template && tar xf - ) ; else mkdir -p /data-template$( dirname $i ) ; fi ; mkdir -p $( dirname $i ) ; if ["$i" == /var/log/] ; then mv /var/log /var/log-removed ; else rm -rf $i ; fi ; ln -sf /data${i%/} ${i%/} ; done
  ---> Running in 1e849a37ee72
/etc/certmonger/
/etc/dirsrv/
.....
/var/named/data/
/var/named/dynamic/
/var/named/dyndb-ldap/
  ---> 49bf3153d005
Removing intermediate container 1e849a37ee72
Step 30/45 : RUN rm -rf /var/log-removed
  ---> Running in 35d0bb1e34ac
  ---> 6d13c89ca7b8
Removing intermediate container 35d0bb1e34ac
Step 31/45 : RUN sed -i 's!^d /var/log.*!L /var/log - - - - /data/var/log!' /usr/lib/tmpfiles.d/var.conf
  ---> Running in 3287ce189368
  ---> 0fc4ec2c345c
Removing intermediate container 3287ce189368
Step 32/45 : RUN mv /usr/lib/tmpfiles.d/journal-nocow.conf /usr/lib/tmpfiles.d/journal-nocow.conf.disabled
  ---> Running in 07849f109455
  ---> d80610223617
Removing intermediate container 07849f109455
Step 33/45 : RUN rm -f /data-template/var/lib/systemd/random-seed
  ---> Running in b009e068aa00
  ---> 3aa621b575ae
Removing intermediate container b009e068aa00
Step 34/45 : RUN echo 1.1 > /etc/volume-version
  ---> Running in a9e66d69544f
  ---> 05d2ab591923
Removing intermediate container a9e66d69544f
Step 35/45 : ENV container docker
  ---> Running in 27b114bb9901
  ---> 3b927b73f0db
Removing intermediate container 27b114bb9901
Step 36/45 : EXPOSE 53/udp 53 80 443 389 636 88 464 88/udp 464/udp 123/udp 7389 9443 9444 9445
  ---> Running in da76877790e9
  ---> 40e09ab03c05
Removing intermediate container da76877790e9
Step 37/45 : VOLUME /tmp /run /data /var/log/journal
  ---> Running in 0ea0157b1149
  ---> 81126c6e8057
Removing intermediate container 0ea0157b1149
Step 38/45 : STOPSIGNAL RTMIN+3
  ---> Running in 0829533a8567
  ---> 0d9947067ebe
Removing intermediate container 0829533a8567
Step 39/45 : ENTRYPOINT /usr/local/sbin/init
  ---> Running in 3f6c0821043f
  ---> 31def441bb06
Removing intermediate container 3f6c0821043f
Step 40/45 : RUN uuidgen > /data-template/build-id
  ---> Running in 70183a84ee14
  ---> dbb914132b5f
Removing intermediate container 70183a84ee14
Step 41/45 : LABEL install 'docker run -ti --rm --privileged -v /:/host -e HOST=/host -e DATADIR=/var/lib/${NAME} -e NAME=${NAME} -e IMAGE=${IMAGE} ${IMAGE} /bin/install.sh'
  ---> Running in 6deca08f490d
  ---> 5fed892b4df7
Removing intermediate container 6deca08f490d
Step 42/45 : LABEL run 'docker run ${RUN_OPTS} --name ${NAME} -v /var/lib/${NAME}:/data:Z -v /sys/fs/cgroup:/sys/fs/cgroup:ro --tmpfs /run --tmpfs /tmp -v /dev/urandom:/dev/random:ro ${IMAGE}'
  ---> Running in 7c26df7faabc
  ---> 686f0db1737b
Removing intermediate container 7c26df7faabc
Step 43/45 : LABEL RUN_OPTS_FILE '/var/lib/${NAME}/docker-run-opts'
  ---> Running in 7ecd298291f9
  ---> 6070645145b8
Removing intermediate container 7ecd298291f9
Step 44/45 : LABEL stop 'docker stop ${NAME}'
  ---> Running in 7303fefc3b5c
  ---> b43a46e901d8
Removing intermediate container 7303fefc3b5c
Step 45/45 : LABEL uninstall 'docker run --rm --privileged -v /:/host -e HOST=/host -e DATADIR=/var/lib/${NAME} ${IMAGE} /bin/uninstall.sh'
  ---> Running in bf4fb0f57293
  ---> e17fec1f8cf2
Removing intermediate container bf4fb0f57293
Successfully built e17fec1f8cf2

{% endhighlight %}

Once the repository is build, we can verify the images in docker.The docker image we created is `freeipa-server` showing below

{% highlight console %}

[root@fedora25 freeipa-container-master]# docker images
REPOSITORY TAG IMAGE ID CREATED SIZE
freeipa-server latest e17fec1f8cf2 10 minutes ago 855 MB
registry.fedoraproject.org/fedora 27 9881e4229c95 47 hours ago 252 MB
docker.io/freeipa/freeipa-server latest c1ab4ccd4cbc 7 days ago 795 MB

{% endhighlight %}
#### How to run the FreeIPA docker container

Now before running the container. Create a directory(used as a volume in docker instance) and set the necessary permission

{% highlight console %}

  [root@fedora25 freeipa-container-master]# mkdir /var/lib/ipa-data

{% endhighlight %}{% highlight console %}

[root@fedora25 freeipa-container-master]# setsebool -P container_manage_cgroup 1
[root@fedora25 freeipa-container-master]# chmod 777 /var/lib/ipa-data

{% endhighlight %}

If you need to access the docker container outside the host, you should map the container ports with host ports using option -p 53:53/udp -p 53:53 -p 80:80 -p 443:443 -p 389:389 -p 636:636 -p 88:88 -p 464:464 -p 88:88/udp -p 464:464/udp -p 123:123/udp -p 7389:7389 -p 9443:9443 -p 9444:9444 -p 9445:9445. But here of for testing i am doing the default install

Now start run the docker

{% highlight console %}

[root@fedora25 freeipa-container-master]# docker run --name freeipa-server-container -ti -h freeipa.vikki.in -v /sys/fs/cgroup:/sys/fs/cgroup:ro --tmpfs /run --tmpfs /tmp -v /var/lib/ipa-data:/data:Z freeipa-server
systemd 234 running in system mode. (+PAM +AUDIT +SELINUX +IMA -APPARMOR +SMACK +SYSVINIT +UTMP +LIBCRYPTSETUP +GCRYPT +GNUTLS +ACL +XZ +LZ4 +SECCOMP +BLKID +ELFUTILS +KMOD -IDN2 +IDN default-hierarchy=hybrid)
Detected virtualization docker.
Detected architecture x86-64.
Set hostname to <freeipa.vikki.in>.
Initializing machine ID from random generator.
system.slice: Failed to set invocation ID on control group /system.slice/docker-30667326bf93d1776a13acc7f395167f87aeb44326f4785e51c851bf35a1f46f.scope/system.slice, ignoring: Operation not permitted
systemd-journald.service: Failed to set invocation ID on control group /system.slice/docker-30667326bf93d1776a13acc7f395167f87aeb44326f4785e51c851bf35a1f46f.scope/system.slice/systemd-journald.service, ignoring: Operation not permitted
systemd-tmpfiles-setup.service: Failed to set invocation ID on control group /system.slice/docker-30667326bf93d1776a13acc7f395167f87aeb44326f4785e51c851bf35a1f46f.scope/system.slice/systemd-tmpfiles-setup.service, ignoring: Operation not permitted
Sat Jan 20 07:09:58 UTC 2018 /usr/sbin/ipa-server-configure-first 

The log file for this installation can be found in /var/log/ipaserver-install.log
==============================================================================
This program will set up the FreeIPA Server.

This includes:
  * Configure a stand-alone CA (dogtag) for certificate management
  * Configure the Network Time Daemon (ntpd)
  * Create and configure an instance of Directory Server
  * Create and configure a Kerberos Key Distribution Center (KDC)
  * Configure Apache (httpd)
  * Configure the KDC to enable PKINIT

To accept the default shown in brackets, press the Enter key.

Do you want to configure integrated DNS (BIND)? [no]: 

Enter the fully qualified domain name of the computer
on which you're setting up server software. Using the form
<hostname>.<domainname>
Example: master.example.com.


Server host name [freeipa.vikki.in]: 

The domain name has been determined based on the host name.

Please confirm the domain name [vikki.in]: 

The kerberos protocol requires a Realm name to be defined.
This is typically the domain name converted to uppercase.

Please provide a realm name [VIKKI.IN]: 
Certain directory server operations require an administrative user.
This user is referred to as the Directory Manager and has full access
to the Directory for system management tasks and will be added to the
instance of directory server created for IPA.
The password must be at least 8 characters long.

Directory Manager password: 
Password (confirm): 

The IPA server requires an administrative user, named 'admin'.
This user is a regular system account used for IPA server administration.

IPA admin password: 
Password (confirm): 


The IPA Master Server will be configured with:
Hostname: freeipa.vikki.in
IP address(es): 172.17.0.2
Domain name: vikki.in
Realm name: VIKKI.IN

Continue to configure the system with these values? [no]: yes

The following operations may take some minutes to complete.
Please wait until the prompt is returned.

Configuring NTP daemon (ntpd)
  [1/4]: stopping ntpd
  [2/4]: writing configuration
  [3/4]: configuring ntpd to start on boot
  [4/4]: starting ntpd
Done configuring NTP daemon (ntpd).
Configuring directory server (dirsrv). Estimated time: 30 seconds
  [1/45]: creating directory server instance
  [2/45]: enabling ldapi
  [3/45]: configure autobind for root
  ....  
  [45/45]: configuring directory to start on boot
Done configuring directory server (dirsrv).
Configuring Kerberos KDC (krb5kdc)
  [1/10]: adding kerberos container to the directory
  [2/10]: configuring KDC
  [3/10]: initialize kerberos container
  ....
  [28/29]: adding 'ipa' CA entry
  [29/29]: configuring certmonger renewal for lightweight CAs
Done configuring certificate server (pki-tomcatd).
Configuring directory server (dirsrv)
  [1/3]: configuring TLS for DS instance
  [2/3]: adding CA certificate entry
  [3/3]: restarting directory server
Done configuring directory server (dirsrv).
Configuring ipa-otpd
  [1/2]: starting ipa-otpd 
  [2/2]: configuring ipa-otpd to start on boot
Done configuring ipa-otpd.
Configuring ipa-custodia
  [1/5]: Generating ipa-custodia config file
  [2/5]: Making sure custodia container exists
  [3/5]: Generating ipa-custodia keys
  [4/5]: starting ipa-custodia 
  [5/5]: configuring ipa-custodia to start on boot
Done configuring ipa-custodia.
Configuring the web interface (httpd)
  [1/22]: stopping httpd
  [2/22]: setting mod_nss port to 443
  ....
  [22/22]: enabling oddjobd
Done configuring the web interface (httpd).
Configuring Kerberos KDC (krb5kdc)
  [1/1]: installing X509 Certificate for PKINIT
Done configuring Kerberos KDC (krb5kdc).
Applying LDAP updates
Upgrading IPA:. Estimated time: 1 minute 30 seconds
  [1/9]: stopping directory server
  .....
  [9/9]: starting directory server
Done.
Restarting the KDC
ipaserver.dns_data_management: ERROR unable to resolve host name freeipa.vikki.in. to IP address, ipa-ca DNS record will be incomplete
Please add records in this file to your DNS system: /tmp/ipa.system.records.dc9aakkj.db
Configuring client side components
Using existing certificate '/etc/ipa/ca.crt'.
Client hostname: freeipa.vikki.in
Realm: VIKKI.IN
DNS Domain: vikki.in
IPA Server: freeipa.vikki.in
BaseDN: dc=vikki,dc=in

Skipping synchronizing time with NTP server.
New SSSD config will be created
Configured sudoers in /etc/nsswitch.conf
Configured /etc/sssd/sssd.conf
trying https://freeipa.vikki.in/ipa/json
[try 1]: Forwarding 'schema' to json server 'https://freeipa.vikki.in/ipa/json'
trying https://freeipa.vikki.in/ipa/session/json
[try 1]: Forwarding 'ping' to json server 'https://freeipa.vikki.in/ipa/session/json'
[try 1]: Forwarding 'ca_is_enabled' to json server 'https://freeipa.vikki.in/ipa/session/json'
Systemwide CA database updated.
SSSD enabled
Configured /etc/openldap/ldap.conf
/etc/ssh/ssh_config not found, skipping configuration
/etc/ssh/sshd_config not found, skipping configuration
Configuring vikki.in as NIS domain.
Client configuration complete.
The ipa-client-install command was successful

==============================================================================
Setup complete

Next steps:
  1. You must make sure these network ports are open:
    TCP Ports:
      * 80, 443: HTTP/HTTPS
      * 389, 636: LDAP/LDAPS
      * 88, 464: kerberos
    UDP Ports:
      * 88, 464: kerberos
      * 123: ntp

  2. You can now obtain a kerberos ticket using the command: 'kinit admin'
      This ticket will allow you to use the IPA tools (e.g., ipa user-add)
      and the web user interface.
  3. Kerberos requires time synchronization between clients
      and servers for correct operation. You should consider enabling ntpd.

Be sure to back up the CA certificates stored in /root/cacert.p12
These files are required to create replicas. The password for these
files is the Directory Manager password
FreeIPA server does not run DNS server, skipping update-self-ip-address.
Created symlink /etc/systemd/system/container-ipa.target.wants/ipa-server-update-self-ip-address.service → /usr/lib/systemd/system/ipa-server-update-self-ip-address.service.
Created symlink /etc/systemd/system/container-ipa.target.wants/ipa-server-upgrade.service → /usr/lib/systemd/system/ipa-server-upgrade.service.
Removed /etc/systemd/system/container-ipa.target.wants/ipa-server-configure-first.service.
FreeIPA server configured.

{% endhighlight %}

Now the FreeIPA docker container is ready. Verify the status of running container.

{% highlight console %}

[root@fedora25 ~]# docker ps -a
    CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
30667326bf93 freeipa-server "/usr/local/sbin/init" 45 minutes ago Up 44 minutes 53/tcp, 80/tcp, 53/udp, 88/udp, 88/tcp, 389/tcp, 443/tcp, 123/udp, 464/tcp, 636/tcp, 7389/tcp, 9443-9445/tcp, 464/udp freeipa-server-container

{% endhighlight %}

#### How to enroll the host to FreeIPA running in container

We can also enroll the host to FreeIPA server running in container.Since i don't have DNS configured, i manually added the FreeIPA docker container IP to the local resolver file in host machine.

{% highlight console %}

[root@fedora25 ~]# docker inspect --format '{\{.NetworkSettings.IPAddress}\}' 1freeipa-server-container
172.17.0.2
[root@fedora25 ~]# cat /etc/hosts |grep freeipa
172.17.0.2 freeipa.vikki.in

{% endhighlight %}

Now install the ipa client in fedora host machine.

{% highlight console %}

[root@fedora25 ~]# ipa-client-install 
WARNING: ntpd time&date synchronization service will not be configured as
conflicting service (chronyd) is enabled
Use --force-ntpd option to disable it and force configuration of ntpd

DNS discovery failed to determine your DNS domain
Provide the domain name of your IPA server (ex: example.com): vikki.in
Provide your IPA server name (ex: ipa.example.com): freeipa.vikki.in
The failure to use DNS to find your IPA server indicates that your resolv.conf file is not properly configured.
Autodiscovery of servers for failover cannot work with this configuration.
If you proceed with the installation, services will be configured to always access the discovered server for all operations and will not fail over to other servers in case of failure.
Proceed with fixed values and no DNS discovery? [no]: yes
Client hostname: fedora25.vikki.in
Realm: VIKKI.IN
DNS Domain: vikki.in
IPA Server: freeipa.vikki.in
BaseDN: dc=vikki,dc=in

Continue to configure the system with these values? [no]: yes
Skipping synchronizing time with NTP server.
User authorized to enroll computers: admin
Password for admin@VIKKI.IN: 
Successfully retrieved CA cert
    Subject: CN=Certificate Authority,O=VIKKI.IN
    Issuer: CN=Certificate Authority,O=VIKKI.IN
    Valid From: 2018-01-20 07:13:00
    Valid Until: 2038-01-20 07:13:00

Enrolled in IPA realm VIKKI.IN
Created /etc/ipa/default.conf
New SSSD config will be created
Configured sudoers in /etc/nsswitch.conf
Configured /etc/sssd/sssd.conf
Configured /etc/krb5.conf for IPA realm VIKKI.IN
trying https://freeipa.vikki.in/ipa/json
[try 1]: Forwarding 'schema' to json server 'https://freeipa.vikki.in/ipa/json'
trying https://freeipa.vikki.in/ipa/session/json
[try 1]: Forwarding 'ping' to json server 'https://freeipa.vikki.in/ipa/session/json'
[try 1]: Forwarding 'ca_is_enabled' to json server 'https://freeipa.vikki.in/ipa/session/json'
Systemwide CA database updated.
Hostname (fedora25.vikki.in) does not have A/AAAA record.
Failed to update DNS records.
Missing A/AAAA record(s) for host fedora25.vikki.in: 172.17.0.1.
Missing reverse record(s) for address(es): 172.17.0.1.
Adding SSH public key from /etc/ssh/ssh_host_rsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ecdsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ed25519_key.pub
[try 1]: Forwarding 'host_mod' to json server 'https://freeipa.vikki.in/ipa/session/json'
Could not update DNS SSHFP records.
SSSD enabled
Configured /etc/openldap/ldap.conf
Configured /etc/ssh/ssh_config
Configured /etc/ssh/sshd_config
Configuring vikki.in as NIS domain.
Client configuration complete.
The ipa-client-install command was successful

{% endhighlight %}

Once client is installed and authenticated to the FreeIPA server, we can verify the hosts by login to GUI as shown below

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2018/01/Screenshot-from-2018-01-20-13-22-56.png" class="kg-image" alt="Screenshot-from-2018-01-20-13-22-56"></figure><!--kg-card-end: image-->

Verify the users are synced to the client.

{% highlight console %}

[root@fedora25 ~]# id vivek
uid=1661600001(vivek) gid=1661600001(vivek) groups=1661600001(vivek)
[root@fedora25 ~]# 

{% endhighlight %}
