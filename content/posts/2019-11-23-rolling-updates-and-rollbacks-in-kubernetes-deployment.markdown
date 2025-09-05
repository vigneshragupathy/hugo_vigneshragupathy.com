---
#layout: post
title: Rolling updates and Rollbacks in Kubernetes deployment
date: '2019-11-23 06:18:21'
tags:
- kubernetes
- linux
- opensource
author: Vignesh Ragupathy
comments: true
draft: true
---

Kubernetes provides rollout options to do &nbsp;update on deployment and easily fallback to any revision. We are going to see how to update the deployment to a newer version of container image and rollback to previous version without affecting the services

### **Setup**

I am using the Virtualbox(running in Ubuntu 18.04 physical machine) for this entire setup . The physical machine is Dell inspiron laptop with 12GB RAM , Intel® Core™ i7-6500U CPU @ 2.50GHz × 4 and 512GB SSD hardisk.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2019/11/Screenshot-from-2019-11-23-11-56-54.png" class="kg-image"></figure><!--kg-card-end: image-->
### Step 1: Create a deployment
```bash

vikki@kubernetes1:~$ kubectl create deployment nginx --image=nginx
deployment.apps/nginx created

vikki@kubernetes1:~$ kubectl get deployments -o wide
NAME READY UP-TO-DATE AVAILABLE AGE CONTAINERS IMAGES SELECTOR
nginx 1/1 1 1 25s nginx nginx app=nginx

```
### Step 2: Export the deployment to yaml file and add the port option(for nginx image the port is 80)

```bash

vikki@kubernetes1:~$ kubectl get deployments -o yaml > nginx.yaml

vikki@kubernetes1:~$ vim nginx.yaml
ports:
        - containerPort: 80
            protocol: TCP

```
### Step 3: Apply the changes to the deployment
```bash

vikki@kubernetes1:~$ kubectl apply -f nginx.yaml
Warning: kubectl apply should be used on resource created by either kubectl create --save-config or kubectl applydeployment.apps/nginx configured

```
### Step 4: Expose the deployment as ClusterIP
```bash

vikki@kubernetes1:~$ kubectl expose deployment nginx --type=ClusterIP
service/nginx exposed

vikki@kubernetes1:~$ kubectl get service nginx
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
nginx ClusterIP 10.102.68.171 80/TCP 8s

```
### Step 5: Verify the service by accessing nginx deployment using the ClusterIP
```bash

vikki@kubernetes1:~$ curl 10.102.68.171
Welcome to nginx!
If you see this page, the nginx web server is successfully installed and working. Further configuration is required.
For online documentation and support please refer to nginx.org.Commercial support is available at nginx.com.
Thank you for using nginx.

```
### Step 6: Verify the current version of Nginx

Go to the kubernetes node kubernetes2 and verify the nginx version

```bash

root@kubernetes2:~# docker exec -it k8s_nginx_nginx-85ff79dd56-mch7j_default_4608325f-2432-4ff3-86ab-e1f2b01dd8f2_0 nginx -v
nginx version: nginx/1.17.6

```

> Now we have made 2 changes to the nginx deployment

- Orignal Nginx deployment
- Nginx deployment with container port set as 80

### Step 7: set Nginx with a different image version
```bash

vikki@kubernetes1:~$ kubectl set image deployment nginx nginx=nginx:1.9.1
deployment.apps/nginx image updated

```

Verify the nginx version in node kubernetes2

```bash

root@kubernetes2:~# docker ps -a |grep nginx
e547e6fc1ad1 nginx "nginx -g 'daemon of…" 37 seconds ago Up 36 seconds k8s_nginx_nginx-69fbc8b64f-2k6wm_default_4695011d-de3b-497d-81b3-2f5de48c3e92_0
1142c1ff00ee k8s.gcr.io/pause:3.1 "/pause" 41 seconds ago Up 40 seconds k8s_POD_nginx-69fbc8b64f-2k6wm_default_4695011d-de3b-497d-81b3-2f5de48c3e92_0
root@kubernetes2:~# docker exec -it k8s_nginx_nginx-69fbc8b64f-2k6wm_default_4695011d-de3b-497d-81b3-2f5de48c3e92_0 nginx -v
nginx version: nginx/1.9.1

```

Now the nginix version is changed from **1.17.6** to **1.9.1**

### Step 8: Verify the service by accessing nginx deployment using the ClusterIP
```bash

vikki@kubernetes1:~$ curl 10.102.68.171
Welcome to nginx!
If you see this page, the nginx web server is successfully installed and working. Further configuration is required.
For online documentation and support please refer to nginx.org.Commercial support is available at nginx.com.
Thank you for using nginx.

```
### Step 9: Verify the rollout history
```bash

vikki@kubernetes1:~$ kubectl rollout history deployment nginx 
deployment.apps/nginx
REVISION CHANGE-CAUSE
1         
2         
3

```

> Now we have made 3 changes to the nginx deployment

### Step 10: Now rollback to older revision and verify the nginx version changes
```bash

vikki@kubernetes1:~$ kubectl rollout undo deployment nginx --to-revision=2
deployment.apps/nginx rolled back
vikki@kubernetes1:~$ kubectl rollout status deployment nginx
deployment "nginx" successfully rolled out

``````bash

root@kubernetes2:~# docker ps -a |grep nginx
5825d85fca05 nginx "nginx -g 'daemon of…" 11 seconds ago Up 11 seconds k8s_nginx_nginx-85ff79dd56-6vjx6_default_3ae5f3ba-af97-4320-9684-46c2ad8f69d6_0
8467c77a5e10 k8s.gcr.io/pause:3.1 "/pause" 17 seconds ago Up 16 seconds k8s_POD_nginx-85ff79dd56-6vjx6_default_3ae5f3ba-af97-4320-9684-46c2ad8f69d6_0
1142c1ff00ee k8s.gcr.io/pause:3.1 "/pause" 3 minutes ago Exited (0) 9 seconds ago k8s_POD_nginx-69fbc8b64f-2k6wm_default_4695011d-de3b-497d-81b3-2f5de48c3e92_0

root@kubernetes2:~# docker exec -it k8s_nginx_nginx-85ff79dd56-6vjx6_default_3ae5f3ba-af97-4320-9684-46c2ad8f69d6_0 nginx -v
nginx version: nginx/1.17.6

```

Now the nginix version is changed from &nbsp; **1.9.1** to **1.17.6**

### Step 11: Verify the service by accessing nginx deployment using the ClusterIP
```bash

vikki@kubernetes1:~$ curl 10.102.68.171
Welcome to nginx!
If you see this page, the nginx web server is successfully installed and working. Further configuration is required.
For online documentation and support please refer to nginx.org.Commercial support is available at nginx.com.
Thank you for using nginx.

```

> We successfully done the rollout in nginx deployment

