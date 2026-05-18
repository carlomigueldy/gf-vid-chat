---
name: spawn-micro-devs
description: Spawn the Micro Devs agent team for gf-vid-chat. Creates a coordinated team with 7 specialists (frontend, P2P, QA, shipper, architect, designer, orchestrator) ready to work on tasks.
---

# Spawn Micro Devs Team

You are about to spawn the **Micro Devs** team — a 7-agent team purpose-built for the gf-vid-chat project.

## Instructions

Follow these steps exactly:

### Step 1: Enter a worktree

Per project rules, all work happens in worktrees. If not already in one, create a worktree for the current task:

```
git worktree add ../<worktree-name> -b feat/<task-name>
```

Or use the EnterWorktree tool if available.

### Step 2: Create the team

Use TeamCreate to create a team named `micro-devs`:

```
TeamCreate({ team_name: "micro-devs", description: "Micro Devs team for gf-vid-chat" })
```

### Step 3: Create the task list

Use TaskCreate to break the user's request into discrete tasks with clear acceptance criteria. Identify:
- Which agents own which tasks
- Dependencies between tasks
- What can run in parallel

### Step 4: Spawn all 7 agents

Spawn each agent using the Agent tool with `team_name: "micro-devs"`. Use the project-scoped agent definitions in `.claude/agents/`.

| Name | subagent_type | model | Spawn |
|------|--------------|-------|-------|
| `orchestrator` | `micro-devs-orchestrator` | opus | Always first |
| `frontend` | `senior-frontend-dev` | sonnet | On demand |
| `p2p` | `p2p-specialist` | sonnet | On demand |
| `qa` | `qa-e2e` | sonnet | On demand |
| `shipper` | `shipper` | sonnet | On demand |
| `architect` | `principal-architect` | opus | On demand |
| `designer` | `product-designer` | sonnet | On demand |

**Always spawn the orchestrator first.** The orchestrator decides which other agents to spawn based on the task.

### Step 5: Brief the orchestrator

Send the orchestrator a message with:
1. The user's full request
2. The task list you created
3. Any relevant context from memory or CLAUDE.md

The orchestrator will then:
- Assign tasks to agents
- Manage dependencies and handoffs
- Run quality gates
- Create the PR when complete

## Dispatch Shortcuts

If the user's request clearly maps to a single domain, you may spawn only the relevant agents instead of the full team:

| Request Type | Agents to Spawn |
|---|---|
| UI-only work | orchestrator + designer + frontend + qa |
| P2P/video feature | orchestrator + architect + p2p + frontend + qa |
| Bug fix (frontend) | orchestrator + frontend + qa |
| Bug fix (P2P) | orchestrator + p2p + qa |
| Architecture/planning only | orchestrator + architect |
| Deploy/ship only | orchestrator + shipper |
| Full feature | All 7 agents |

## Quality Gate Reminder

Before the team marks work complete, the orchestrator MUST verify:
1. `pnpm type-check` — zero errors
2. `pnpm lint` — zero errors  
3. `pnpm test` — all passing
4. `pnpm build` — successful
5. PR created (never push to main)
6. No AI attribution in commits
