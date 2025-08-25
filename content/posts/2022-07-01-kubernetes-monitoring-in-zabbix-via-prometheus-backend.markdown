---
#layout: post
title: Kubernetes monitoring in Zabbix via Prometheus backend
date: '2022-07-01 10:00:00'
tags:
- kubernetes
- opensource
- observability
author: Vignesh Ragupathy
comments: true
---
## Summary

Monitoring in Kubernetes is a complex task.

The traditional monitoring framework is not sufficient to handle such a massive workload.

Zabbix since version 6.0 provides a native way of integration for monitoring Kubernetes cluster.

Zabbix-Kubernetes integration provides various templates to monitor kubernetes components like `kube-controller-manager`, `kube-apiserver`, `kube-scheduler`, `kubelet`, etc.

It also supports automatic discovery of kubernetes nodes, pods and also collects metrics agentlessly.

## Why I don't like the Zabbix's direct way of monitoring Kubernetes cluster?

Although Zabbix-Kubernetes integration looks promising in the beginning , it is not easy to use.

The documentation is not clear, it is mostly based on the assumption that the Zabbix server is running inside the same Kubernetes cluster.

There are so much details missing in the documentation especially if you want to do the monitoring from external Zabbix server or even to do a multiple cross cluster monitoring.

And finally, most of all, the  Zabbix monitoring system is not designed to monitor `directly` such a volatile, dynamic, multi-dimensional metrics from infrastructure like Kubernetes.

## Why Prometheus?

Prometheus is an opensource monitoring system which can collect massive amount of data in near real-time using it's pull-based mechanism.

Prometheus can be easily configured for service discovery.

It is agentless and works by sending an HTTP request so-called scrape, which can find the endpoints and scrap metrics from any source.

The response from scrape request is parsed and stored in Prometheus database.

Prometheus provided powerful querying using it's PromQL and the metrics collected can be pulled from any external system like Zabbix or Grafana via its API.

> Using Prometheus federation, we can easily collect metrics from multiple Kubernetes clusters and create a hierarchically scaled monitoring system.

## How Prometheus exposes metrics?

Prometheus collects the metrics from any source by scraping the HTTP endpoint which contains metrics.

It also provides a web interface to view the metrics.

The metrics are exposed via API.

Prometheus metrics can be queried by any HTTP client using it's API Endpoints.

**Query Prometheus using curl**

```
curl -X GET  'https://PROMETHEUS_HOSTNAME/api/v1/query?query=up' | jq status.
```

**Query on kubernetes node metrics**

```
curl -X GET  'https://PROMETHEUS_HOSTNAME/api/v1/query?query=kube_node_info' | jq status.
```

**Advanced query operations like boolean**

```
curl -X GET  'http://PROMETHEUS_HOSTNAME/api/v1/query?query={__name__=~"kube_pod_container_resource_limits_cpu_cores|kube_pod_status_phase"}>0' | jq .
```

## Why Prometheus is just not good enough?

Prometheus is good for collecting the metrics from Kubernetes cluster.
But it is not enough to act as a full-stack monitoring system.

Here are some of the limitations.

- Very basic visualization of the metrics.
- No AI/ML features like automatic anomaly detection
- No role based access control
- Long term storage is not available.

## Proposed approach

> The proposed approach is to use Prometheus as a backend for Zabbix.

This approach provides the flexibility of using Prometheus pull based metrics collection, scalability and PromQL queries. Also the advantage of Zabbix for alerting, anomaly detection and role based access control etc.

**Architecture of the proposed approach**

![prometheus_federate](content/images/2022/kubernetes-promethues-federate.png)
