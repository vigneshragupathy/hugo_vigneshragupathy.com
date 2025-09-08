---
#layout: post
title: Building AI for Observability with AWS Bedrock
date: '2025-09-04 00:45:00'
tags:
- AI
- opensource
- observability
author: Vignesh Ragupathy
comments: true
cover:
    image: ../../images/2025/bedrock.drawio.svg
    alt: Building AI for Observability with AWS Bedrock
---

# Building AI for Observability with AWS Bedrock

In my {{< newtabref  href="https://vigneshragupathy.com/closing-the-last-mile-of-observability-with-ai/" title="previous post" >}}, I wrote about *closing the last mile of observability with AI* . The core idea was simple: we already have plenty of metrics, logs, and traces, but the real challenge is turning them into **insights** and **answers** that engineers can act on.

In that post, I highlighted two main gaps:

* **Connector layer** – bridging multiple observability tools like Prometheus, Thanos, Elastic, etc.
* **Insight layer** – going beyond raw queries to provide real context and recommendations.

Now, I’ve been experimenting with **AWS Bedrock** , and it feels like a natural way to solve both layers.

### Why Bedrock?

What excites me about Bedrock is how it combines **models** with **action groups** :

* **Models** give you the reasoning power to understand a user’s question in plain English.
* **Action groups** let the model trigger Lambda functions, fetch data from observability tools, and return structured answers.

In practice, this means I can ask something like:

> *“Error rate increased in the last hour, help diagnose”*

The Bedrock agent:

1. Understands the intent behind the question.
2. Calls the right connector (Prometheus/Thanos/Elastic) via an action group.
3. Returns not just numbers, but insights — e.g., “CPU utilization spiked to 85% in the last 10 minutes, which likely caused the slowdown.”

#### Design of AWS Bedrock for Observability
<br>

![observability AI](../../images/2025/bedrock.drawio.svg)

### Personal Takeaway

For me, this feels like a big step toward making observability **human-friendly** . Engineers don’t want to remember PromQL syntax or juggle Grafana dashboards at 2 AM. They want to ask questions and get answers.

Bedrock makes this possible without building everything from scratch. It’s the missing piece that bridges **observability data** with **AI-driven insights** .

### What’s Next

I’m continuing to explore how we can extend this further — from drawing graphs directly in the chat UI to integrating knowledge bases for deeper context. But even at this stage, I can see Bedrock lowering the barrier for building AI in observability.

And that’s the real win: helping teams move faster, solve problems sooner, and sleep a little better.
