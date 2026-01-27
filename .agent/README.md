# 🚀 Spec-Kit: Antigravity Skills & Workflows

> **The Event Horizon of Software Quality.**
> *Adapted for Google Antigravity IDE from [github/spec-kit](https://github.com/github/spec-kit).*

---

## 🌟 Overview

Welcome to the **Antigravity Edition** of Spec-Kit. This system is architected to empower your AI pair programmer (Antigravity) to drive the entire Software Development Life Cycle (SDLC) using two powerful mechanisms: **Workflows** and **Skills**.

### 🔄 Dual-Mode Intelligence
In this edition, Spec-Kit commands have been split into two interactive layers:

1.  **Workflows (`/speckit.name`)**: High-level orchestrations that guide the agent through a series of logical steps. They are great for manual triggering and guided processes.
2.  **Skills (`@speckit.name`)**: Packaged agentic capabilities. Mentions of a skill give the agent immediate context and autonomous "know-how" to execute the specific toolset associated with that phase.

> **To understand the power of Skills in Antigravity, read the docs here:**
> [https://antigravity.google/docs/skills](https://antigravity.google/docs/skills)

---

## 🛠️ Installation

To enable these agent capabilities in your project:

1.  **Add the folder**: Drop the `.agent/` folder into the root of your project workspace.
2.  **That's it!** Antigravity automatically detects the `.agent/skills` and `.agent/workflows` directories. It will instantly gain the ability to perform Spec-Driven Development.

---

## 🏗️ The Architecture

The toolkit is organized into modular components that provide both the logic (Scripts) and the structure (Templates) for the agent.

```text
.agent/
├── skills/                  # @ Mentions (Agent Intelligence)
│   ├── speckit.analyze      # The Consistency Checker
│   ├── speckit.checklist    # Requirements Validator
│   ├── speckit.clarify      # Ambiguity Resolver
│   ├── speckit.constitution # Governance Manager
│   ├── speckit.implement    # Code Builder
│   ├── speckit.plan         # Technical Planner
│   ├── speckit.quizme       # Logic Challenger
│   ├── speckit.specify      # Feature Definer
│   ├── speckit.tasks        # Task Breaker
│   └── speckit.taskstoissues# Tracker Syncer
│
├── workflows/               # / Slash Commands (Orchestration)
│   ├── speckit.analyze.md
│   ├── speckit.checklist.md
│   └── ... (and more)
│
└── scripts/                 # Shared Bash Core (Kinetic logic)
```

---

## � Mapping: Commands to Capabilities

| Spec-Kit Phase | Workspace Trigger | Antigravity Skill | Role |
| :--- | :--- | :--- | :--- |
| **Governance** | `/speckit.constitution` | `@speckit.constitution` | Establishes project rules. |
| **Definition** | `/speckit.specify` | `@speckit.specify` | Drafts structured `spec.md`. |
| **Ambiguity** | `/speckit.clarify` | `@speckit.clarify` | Resolves gaps post-spec. |
| **Validation** | `/speckit.checklist` | `@speckit.checklist` | Generates quality gates. |
| **Red Team** | `/quizme` | `@speckit.quizme` | Challenges logical flaws. |
| **Architecture** | `/speckit.plan` | `@speckit.plan` | Generates technical `plan.md`. |
| **Decomposition** | `/speckit.tasks` | `@speckit.tasks` | Breaks plans into atomic tasks. |
| **Final Check** | `/speckit.analyze` | `@speckit.analyze` | Consistency cross-check. |
| **Execution** | `/speckit.implement` | `@speckit.implement` | Builds implementation phases. |

---

## 🚀 Getting Started in Antigravity

Once the `.agent` folder is present, you can talk to your agent as a partner. You can trigger a full process using a slash command or reference a specific capability using a skill mention.

**Example Conversation:**

> **Developer**: "**/speckit.specify** Add a real-time notification system using WebSockets."
>
> **Antigravity**: "Understood. Executing the **@speckit.specify** skill. Creating feature branch `005-notifications` and drafting the initial specification..."
> *(Antigravity creates branch, drafts spec.md)*
>
> **Antigravity**: "Specification ready. I've identified some ambiguity in the reconnection strategy. Should I use **@speckit.clarify** to resolve this?"
>
> **Developer**: "Yes, use **@speckit.clarify**."
> *(Antigravity executes the skill logic, interviewing the developer and updating the spec)*
>
> **Antigravity**: "The spec is now robust. I'm ready to trigger **/speckit.plan** and **/speckit.tasks** to prepare for implementation."

---

## 🧩 Adaptation Notes

*   **Skill-Based Autonomy**: Mentions like `@speckit.plan` trigger the agent's internalized understanding of how to perform that role.
*   **Shared Script Core**: All logic resides in `.agent/scripts/bash` for consistent file and git operations.
*   **Agent-Native**: Designed to be invoked via Antigravity tool calls and reasoning rather than just terminal strings.

---
*Built with logic from [Spec-Kit](https://github.com/github/spec-kit). Powered by Antigravity.*
