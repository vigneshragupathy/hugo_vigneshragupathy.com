---
#layout: post
title: Surviving the Rewrite - Managing Risk and AI Memory Loss in Large-Scale Development
date: '2025-12-18 10:50:00'
tags:
- AI
- engineering
author: Vignesh Ragupathy
comments: true
ShowToc: true
cover:
    image: ../../images/2025/al_assist.webp
    alt: Surviving the Rewrite - Managing Risk and AI Memory Loss in Large-Scale Development
    hiddenInSingle: false
---
### <span style="color:#6366f1">**TL;DR:**</span> 

I recently undertook a project that terrifies most engineers: rewriting a massive, critical infrastructure automation tool from scratch. I moved from legacy Bash to Python without writing a single line of manual code - relying entirely on AI agents. Here is how I managed the risk, the architecture, and the "memory loss" of LLMs to build a production-grade tool.


### <span style="color:#6366f1">**The Stakes**</span>

This wasn’t a simple CRUD app. This tool manages infrastructure for multiple teams. A logic error here doesn’t just throw a stack trace; it could wipe an entire environment or cause immediate customer impact.

The legacy tool was written in Bash. It served us well for years, but it had hit its ceiling. It was unmaintainable, hard to test, and impossible to extend. I needed to move it to Python.

> <span style="color:#ea580c">**The Twist:** </span> I decided to build this by shifting my role from "**coder**" to "**architect**." I would let GitHub Copilot (and other agents) write the syntax, while I enforced the structure.

Over several months, relying heavily on GitHub Copilot (hitting a 73% premium request rate average a month). Here is how I managed the risk, the code, and the AI agents to build a production-grade tool.

### <span style="color:#6366f1">**The "Day 0" Strategy**</span>

When you let an AI write your code, you cannot just **wing it.** If the context is messy, the AI will hallucinate. To make the design understandable for both human maintainers and the AI agent, I established three non-negotiable pillars on Day 0:

* **AI-Friendly Documentation**
* **Strict Modularization**
* **Aggressive Testing Suites**

#### <span style="color:#6366f1">**Documentation as a Linked Context Tree**</span>

The biggest challenge with Large Language Models (LLMs) is context limits. An AI cannot always **see** the whole repository at once. To solve this, I designed my documentation as a **Linked Context Tree** .

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

This was my most critical realization during the project.

AI models evolve. New models are trained on vast datasets, but they **do not have memory of your specific project constraints.**

An AI agent might look at a block of code in the future and say, *"I can optimize this."* It might rewrite the logic, unaware that the "inefficient" code was there to prevent a specific edge-case disaster. 

> <span style="color:#ea580c">**The AI lacks the "history" of *why* a decision was made.**</span>

**My solution? The Test Suite is the Memory.**

Every feature and bug fix must have a corresponding test case. If the AI refactors code in the future, the test suite acts as the guardrail. I automated this so that if files are changed, git automatically invokes the regression suite.

### <span style="color:#6366f1">**The Golden Rule: You Own the Ship**</span>

Even though I wasn't typing the syntax, I was working harder than ever. This process solidified a core philosophy regarding AI-assisted development:

> <span style="color:#ea580c"> **I don’t mind if you let an LLM write all your code, as long as you understand all your code.**</span>

I treated every AI generation the same way I would treat a teammate’s Pull Request:

- Read it.
- Question it.
- Verify it

Make sure it fits the team’s standards and is understandable by the humans who will maintain it.

If the code was good, I shipped it. If it wasn't, I forced the AI to refine it. The AI should accelerate you, not replace your judgment. Ultimately, **you own what goes to production**, no matter who—or what—typed the syntax.

> <span style="color:#ea580c"> **Not all models are created equal. During this project, I learned to switch models based on the task.**</span>

### <span style="color:#6366f1">**Final Thoughts: The Rules of Engagement**</span>

Developing with AI agents didn’t make me lazy; it made me more disciplined. It forced me to clarify my thinking before I even opened the IDE. If you are planning a similar rewrite, keep these principles in mind:

- Documentation is now a prompt.
- You own what goes to production.
- The AI lacks the “history” of why a decision was made in the past.
- AI is a syntax expert, not a systems architect.
- If you can’t explain the request, the AI can’t write the code.
- Every feature and bug fix must have a corresponding test case.
- Review code for intent, not just execution.

