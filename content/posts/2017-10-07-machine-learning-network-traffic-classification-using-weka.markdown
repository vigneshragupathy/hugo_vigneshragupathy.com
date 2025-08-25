---
#layout: post
title: Machine learning – Network traffic classification using weka
date: '2017-10-07 11:52:00'
tags:
- linux
- data-science
- opensource
author: Vignesh Ragupathy
comments: true
---

### Overview

This post is about how to classify network traffic captured from wireshark using weka machine learning algorithm. I tried few other methods like nltk,sckikit,python scripts with naive bayes implementation and finally decided to use weka mainly because of its simplicity,easy to use and also because it is written in java so it is easier to integrate with other java applications(which is i am planning to do).You can check my github machine learning project page for the other methods i tried.

### Software’s used

Wireshark  
weka  
Fedora

#### Step 1 :Installing the softwares

Install the wireshark and weka. Both of the software packeges comes with fedora default repositories, So we can just do the dnf install .

#### Step 2 :Capturing network packets using wireshark

Open wireshark and start capturing the packets in your network interface card . I used specific filters(http,telnet,etc) to capture different type of traffic so that i can use the same as traning set in weka. These captured traffic can be exported into csv file. The files used can be downloaded from [my github](https://github.com/vignesh88/machine_learning/tree/master/weka)

#### Step 3:Converting csv to arff format

We need to export this as csv because the weka application don’t support pcap file. The exported csv can be converted to arff format later using the weka arff viewer.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="/content/images/2017/10/AAEAAQAAAAAAAAP4AAAAJGRiY2Y0MjViLWUyMDAtNDIwNC1iZTZkLWVmMmMyNWEzZTEzOA.png" class="kg-image" alt="AAEAAQAAAAAAAAP4AAAAJGRiY2Y0MjViLWUyMDAtNDIwNC1iZTZkLWVmMmMyNWEzZTEzOA"></figure><!--kg-card-end: image-->
#### Step 4:Defining the class

Now we have converted the wireshark output to arff so that it can be readable be the weka application. The next step is to define the class . Class is something like a category in which the specific instance is belongs to.

For this, I opened the arff file and manually defined the class based on the application the traffic is generated

| Traffic type | Application used |
| ------------- |-------------:|
| http       | browser|
| ftp        | filezilla client|
| bittorrent | peer-peer_client |
| snmp       | monitoring_tools|

<br/>
My final arff file is below, with the class name “Traffic\_category” added.  
Now if you see closely, for some of the instances(5,31,35,53) the “Traffic\_category” class is left undefined.In the next step i am going to use weka to predict the class in which the instance belongs to using machine learning algorithm.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="/content/images/2017/10/AAEAAQAAAAAAAAUBAAAAJGVhYzgxZGU4LTNkYmQtNDU0Zi04ZDQxLWMyMWRmN2MzZDAyNg.png" class="kg-image" alt="AAEAAQAAAAAAAAUBAAAAJGVhYzgxZGU4LTNkYmQtNDU0Zi04ZDQxLWMyMWRmN2MzZDAyNg"></figure><!--kg-card-end: image-->
#### Step 5: Predicting the “Traffic category” using J48ext machine learning algorithm

Now i am going to run the weka J48ext machine learning algorithm to predict the traffic category.There are many algorithm supported by weka like zeroR,naive bayes,we can use any of this which is best suited for our datasets.

Make sure the class path is properly exported before executing the code. In my setup the weka.jar is located inside “/usr/share/java”

{% highlight console %}

export CLASSPATH=$CLASSPATH:/usr/share/java/weka.jar
~jython UsingJ48Ext.py main.arff

{% endhighlight %}

The code can be downloaded from [github](https://github.com/vignesh88/machine_learning/blob/master/weka/UsingJ48Ext.py)  
The output contains 3 type of informations

### 1. Generated model

J48 pruned tree

{% highlight console %}

Protocol = SNMP: monitoring_tools (10.0/1.0)
Protocol = SRVLOC: telnet (0.0)
Protocol = NBNS: telnet (0.0)
Protocol = BROWSER: telnet (0.0)
Protocol = ICMP: telnet (0.0)
Protocol = TCP: telnet (0.0)
Protocol = TELNET: telnet (18.0)
Protocol = BitTorrent: peer-peer_client (12.0)
Protocol = TFTP: filezilla (9.0)
Protocol = HTTP: browsers (4.0)

Number of Leaves : 10

Size of the tree : 11

{% endhighlight %}
### 2. Evaluation
{% highlight console %}

Correctly Classified Instances 52 98.1132 %
Incorrectly Classified Instances 1 1.8868 %
Kappa statistic 0.9753
Mean absolute error 0.0136
Root mean squared error 0.0824
Relative absolute error 4.4312 %
Root relative squared error 21.0904 %
Total Number of Instances 53     
Ignored Class Unknown Instances 4     

{% endhighlight %}
### 3. Prediction
{% highlight console %}

    1 5:monitori 5:monitori 0.9 
    2 5:monitori 5:monitori 0.9 
    5 1:? 5:monitori 0.9 
    6 5:monitori 5:monitori 0.9 
    7 5:monitori 5:monitori 0.9 
27 4:telnet 4:telnet 1 
28 4:telnet 4:telnet 1 
29 2:peer-pee 2:peer-pee 1 
30 2:peer-pee 2:peer-pee 1 
31 1:? 2:peer-pee 1 
32 2:peer-pee 2:peer-pee 1 
33 2:peer-pee 2:peer-pee 1 
34 2:peer-pee 2:peer-pee 1 
35 1:? 2:peer-pee 1 
36 2:peer-pee 2:peer-pee 1 
37 2:peer-pee 2:peer-pee 1 
43 3:filezill 3:filezill 1 
44 3:filezill 3:filezill 1 
45 3:filezill 5:monitori + 0.9 
46 3:filezill 3:filezill 1 
47 3:filezill 3:filezill 1 
52 3:filezill 3:filezill 1 
53 1:? 1:browsers 1 
54 1:browsers 1:browsers 1 

{% endhighlight %}

Now the information provided in prediction is our focus.  
It contains 4 column

{% highlight console %}

Column number	Details
First column	Instance number
Second column	Class defined in dataset
Third column	Class predicted by machine learning
Fourth column	Probability that the instance is belong to the class predicted my machine

{% endhighlight %}

Now if you notice the instance number 5,31,35 and 53 the class defined in dataset is empty(“?”) and the machine has predicted the class as monitoring\_tool,peer-peer client and browser respectively. The “+” symbol in the instance number 45 denotes there is difference in the class defined in dataset and the class predicted by machine learning.

