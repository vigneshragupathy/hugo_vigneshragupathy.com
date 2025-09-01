---
#layout: post
title: Resource limiting CPU and Memory in Kubernetes
date: '2018-10-08 12:16:00'
tags:
- linux
- opensource
- kubernetes
author: Vignesh Ragupathy
comments: true
---

In my previous post, we seen how to [configure kubernetes cluster](/kubernetes-on-ubuntu-18-04-with-dashbaoard) ,[how to deploy pods and grow the cluster](/kubernetes-growing-the-cluster-with-centos-7-node/). Now in this post i am going to show how to resource limiting cpu and memory in a kubernetes deployment. We can also limit resource at namespace level, which will be covered in the later post.

I am going to use a special image [vish/stress](https://hub.docker.com/r/vish/stress/). This image has options for allocating cpu and memory, which can be parsed using an argument for doing the stress test.

My configuration for Master and Worker node is 4GB memory with 2 CPU cores each running in Virtualbox.

First download the vish/stress image and create the deployment. The image vish/stress provides option for creating stress in cpu and memory

{% highlight console %}

vikki@drona-child-1:~$ kubectl run stress-test --image=vish/stress
deployment.apps "stress-test" created

{% endhighlight %}

Wait till the pods status changes to running.

{% highlight console %}

vikki@drona-child-1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-768979984b-mmgbj 1/1 Running 6 65d
stress-test-7795ffcbb-r9mft 0/1 ContainerCreating 0 6s
vikki@drona-child-1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-768979984b-mmgbj 1/1 Running 6 65d
stress-test-7795ffcbb-r9mft 1/1 Running 0 32s

{% endhighlight %}

Now verify the logs from respective container image. In my case the container name for pod stress-test-7795ffcbb-r9mft is e8e43da13b23.  
You can also use `"kubernetes logs stress-test-7795ffcbb-r9mft"`(but its not working in my server)

It shows allocating 0 memory. By default the stress image will not allocation any memory/cpu.

{% highlight console %}

[root@drona-child-3 ~]# docker logs e8e43da13b23
I0819 13:01:00.200714 1 main.go:26] Allocating "0" memory, in "4Ki" chunks, with a 1ms sleep between allocations
I0819 13:01:00.200804 1 main.go:29] Allocated "0" memory

{% endhighlight %}
### Limiting Memory and CPU for the pod

We are going to allocate more memory for this deployment and also going to set resource limit for CPU and Memory. Finally will monitor the deployment behaviour.

Export the yaml for the current deployment "stress-test" and add the resource limit option and Memory/CPU allocation option.

{% highlight console %}

vikki@drona-child-1:~$ kubectl get deployment stress-test -o yaml > stress.test.yaml
vikki@drona-child-1:~$ vim stress.test.yaml

{% endhighlight %}

Now in the above example i restricted cpu to 1 cores and memory to 4GB using limits options. Also i added the argument to allocate 2 cores and memory of 5050MB(~5GB).

The requests and limits option is analogous to the soft and hard limit in Linux.

My total memory available in the worker node is only 4 GB,I am over allocating memory just to check the behaviour. In real case you will be limiting the resources lesser than the available Memory/CPU, otherwise it makes no sense.

Now apply the new yaml to the deployment and wait for the pods to go running status.

{% highlight console %}

vikki@drona-child-1:~$ kubectl replace -f stress.test.yaml 
deployment.extensions "stress-test" replaced
vikki@drona-child-1:~$ 

{% endhighlight %}{% highlight console %}

vikki@drona-child-1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-768979984b-mmgbj 1/1 Running 6 65d
stress-test-7795ffcbb-r9mft 0/1 ContainerCreating 0 8s
stress-test-78944d5478-wmmtc 0/1 Terminating 0 20m
vikki@drona-child-1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-768979984b-mmgbj 1/1 Running 6 65d
stress-test-7795ffcbb-r9mft 1/1 Running 0 32s
vikki@drona-child-1:~$ 

{% endhighlight %}

Check the logs in the container. Its trying to allocate 5050MB memory and 2 CPU.

{% highlight console %}

[root@drona-child-3 ~]# docker logs a9ebee58d3ca
I0819 13:36:36.618405 1 main.go:26] Allocating "5050Mi" memory, in "100Mi" chunks, with a 1s sleep between allocations
I0819 13:36:36.618655 1 main.go:39] Spawning a thread to consume CPU
I0819 13:36:36.618674 1 main.go:39] Spawning a thread to consume CPU

{% endhighlight %}

Open a new terminal and monitor the Memory usage.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2018/08/Screenshot-from-2018-08-19-19-12-37.png" class="kg-image" alt="Screenshot-from-2018-08-19-19-12-37"></figure><!--kg-card-end: image-->

The memory will slowly raises to full usage and finally drops .After some attempts the pod will go "Crashloopbackoff" status.

#### Memory value plotted in graph
<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2018/08/Screenshot-from-2018-08-19-20-40-03.png" class="kg-image" alt="Screenshot-from-2018-08-19-20-40-03"></figure><!--kg-card-end: image-->{% highlight console %}

vikki@drona-child-1:~$ kubectl get pods
NAME READY STATUS RESTARTS AGE
nginx-768979984b-mmgbj 1/1 Running 6 65d
stress-test-57bb689598-8h4zm 0/1 CrashLoopBackOff 3 4m
vikki@drona-child-1:~$ 

{% endhighlight %}

To verify the reason for container termination, we can run the describe pod. In our case it clearly say OOMKilled and was &nbsp;26 times restarted.

{% highlight console %}

vikki@drona-child-1:~$ kubectl describe pod stress-test-dbbcf4fd7-pqh99 |grep -A 5 State
    State: Waiting
        Reason: CrashLoopBackOff
    Last State: Terminated
        Reason: OOMKilled
        Exit Code: 137
        Started: Sun, 19 Aug 2018 21:23:01 +0530
        Finished: Sun, 19 Aug 2018 21:23:24 +0530
    Ready: False
vikki@drona-child-1:~$ kubectl describe pod stress-test-dbbcf4fd7-pqh99 |grep -i restart
    Restart Count: 26
    Warning BackOff 2m (x480 over 2h) kubelet, drona-child-3 Back-off restarting failed container
vikki@drona-child-1:~$ 

{% endhighlight %}