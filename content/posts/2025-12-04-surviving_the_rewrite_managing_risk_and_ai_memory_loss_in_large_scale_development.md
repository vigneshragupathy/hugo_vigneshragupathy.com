---
#layout: post
title: Surviving the Rewrite - Managing Risk and AI Memory Loss in Large-Scale Development
date: '2026-11-27 00:50:00'
tags:
- AI
- engineering
author: Vignesh Ragupathy
comments: true
ShowToc: false
cover:
    image: ../../images/2025/stw_cover.webp
    alt: Surviving the Rewrite - Managing Risk and AI Memory Loss in Large-Scale Development
    hiddenInSingle: true
---
**TL;DR:** I recently undertook a project that terrifies most engineers: rewriting a massive, critical infrastructure automation tool from scratch.

This wasn’t a simple CRUD app. This tool manages infrastructure for multiple teams. A logic error here doesn’t just throw an exception; it could wipe an entire environment or disrupt production, causing immediate customer impact.

The legacy tool was written in Bash. It served us well for many years, but it had hit its limits. It was unmaintainable, hard to test, and impossible to extend. I needed to move it to Python.

> But here is the twist: <span style="color:#ea580c">**I decided to build this without writing a single line of manual code.**</span>

Over several months, relying heavily on GitHub Copilot (hitting a 73% premium request rate average a month), I shifted my role from "coder" to "architect." Here is how I managed the risk, the code, and the AI agents to build a production-grade tool.

**Screenshot:**
![copilot usage](../../images/2025/github_copilot_usage.webp)

### <span style="color:#6366f1">**The "Day 0" Strategy**</span>

When you let an AI write your code, you cannot just "wing it." If the context is messy, the AI will hallucinate. To make the design understandable for both human maintainers and the AI agent, I established three non-negotiable pillars on Day 0:

1. **AI-Friendly Documentation**
2. **Strict Modularization**
3. **Aggressive Testing Suites**

#### <span style="color:#6366f1">**Documentation as Context**</span>

The biggest challenge with Large Language Models (LLMs) is context limits. An AI cannot always "see" the whole repository at once. To solve this, I designed my documentation as a **Linked Context Tree** .

* **The Parent (README.md):** Acts as the map. It links to every child document.
* **The Children:** Every feature and bug fix gets its own document, categorized in specific folders.
* **Circular Linking:** Every child document links back to the Parent.

This structure allows the AI agent to traverse the "knowledge graph" of the project without needing to index the entire codebase every time.

```text

+-----------------------------------------------------------------------+
|                       PROJECT REPOSITORY ROOT                         |
+-----------------------------------------------------------------------+
|                                                                       |
|  [ README.md ] (THE PARENT CONTEXT HUB)                               |
|  * Acts as the central map for the AI agent.                          |
|  * Contains high-level architecture and policies.                     |
|  * Holds the master index of all child documents.                     |
|                                                                       |
|          ↕️ ↕️ ↕️ (Direct bidirectional hyperlinks) ↕️ ↕️ ↕️             |
|                                                                       |
+---- docs/ ------------------------------------------------------------+
|    |                                                                  |
|    +--- features/                                                     |
|    |    |                                                             |
|    |    +--- [ feature-aws-migration.md    ] ↕️ (Links to README)      |
|    |    +--- [ feature-modular-tests.md    ] ↕️ (Links to README)      |
|    |                                                                  |
|    +--- bugs/                                                         |
|    |    |                                                             |
|    |    +--- [ bugfix-critical-db-lock.md  ] ↕️ (Links to README)      |
|    |                                                                  |
|    +--- architecture/                                                 |
|         |                                                             |
|         +--- [ design-decision-python.md   ] ↕️ (Links to README)      |
|                                                                       |
+-----------------------------------------------------------------------+
```

#### <span style="color:#6366f1">**Modular Architecture**</span>

I forced the AI to adhere to strict separation of concerns.

* **Logic Separation:** AWS logic stays in the `aws/` folder. Test logic stays in `tests/`.
* **Simple Entry:** The `main.py` is kept intentionally dead simple, only referring to modules.

> This modularity prevents the "spaghetti code" that AI can sometimes generate if given too much freedom.

#### <span style="color:#6366f1">**The "AI Memory Loss" Problem (And How Tests Solve It)**</span>

This was my most critical realization.

AI models evolve. New models (like moving from GPT-4 to the next iteration) are trained on vast datasets, but they **do not have memory of your specific project constraints.**

An AI agent might look at a block of code in the future and say, *"I can optimize this."* It might rewrite the logic, unaware that the "inefficient" code was there to prevent a specific edge-case disaster. The AI lacks the "history" of *why* a decision was made.

**My solution? The Test Suite is the Memory.**

* Every feature and bug fix *must* have a corresponding test case.
* If the AI refactors code in the future, the test suite acts as the guardrail.
* I automated this: A script checks `git status`. If files are changed, it automatically invokes the regression suite.

### <span style="color:#6366f1">**The Workflow: Human as Reviewer**</span>

Even though I wasn't typing code, I was working harder than ever.

1. **Reviewing > Writing:** You must understand the code thoroughly. Never accept an AI suggestion blindly, especially in infrastructure.
2. **Iterative Prompting:** The first solution is rarely the best. I often have to prompt the agent to "critique its own work" or "optimize for readability" before accepting a change.
3. **Documenting the "Why":** I ensure the AI comments on *why* a bug fix was applied in a certain way directly in the code, serving as breadcrumbs for future agents.

### <span style="color:#6366f1">**Navigating the Agent Landscape**</span>

Not all models are created equal. During this project, I learned to switch models based on the task:

* **For Complex Logic & Reasoning:** I lean towards models like **Claude 3.5 Sonnet** (or high-reasoning variants). They are excellent at handling detailed documentation and complex architectural constraints.
* **For Quick Scripts & Thinking:** Models like **GPT-4o** are great for "long thinking" tasks where I need a solution without constant back-and-forth confirming commands.

### <span style="color:#6366f1">**Final thoughts**</span>

Developing with AI agents didn't make me lazy; it made me more disciplined. By treating the AI as a junior developer who needs clear documentation, strict boundaries, and a safety net of tests, I was able to rewrite a mission-critical tool faster and with higher confidence than I could have done manually.

The future of software engineering isn't just about writing syntax—it's about architecting systems that AI can understand and build safely.
