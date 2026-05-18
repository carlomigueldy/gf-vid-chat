---
name: spawn-micro-devs
description: Spawn the Micro Devs agent team for gf-vid-chat. Creates a coordinated team with 8 specialists (frontend, P2P, QA, shipper, architect, designer, code-reviewer, orchestrator) ready to work on tasks.
---

# Spawn Micro Devs Team

You are about to spawn the **Micro Devs** team — an 8-agent team purpose-built for the gf-vid-chat project.

## Scoping Rules

Agent definitions live in `.claude/agents/` (project-scoped, checked into the repo).
Team runtime state (`~/.claude/teams/` and `~/.claude/tasks/`) is global by design,
so we **namespace the team name to the current worktree** to isolate each team instance.

- Team name format: `micro-devs-<worktree-name>`
- Example: worktree `feat/video-grid` → team name `micro-devs-feat-video-grid`
- This ensures parallel worktrees each get their own team, task list, and mailbox.
- When the worktree is cleaned up, the team lead must clean up the team first.

## Instructions

Follow these steps exactly:

### Step 1: Enter a worktree

Per project rules, all work happens in worktrees. If not already in one, create a worktree for the current task:

```
git worktree add ../<worktree-name> -b feat/<task-name>
```

Or use the EnterWorktree tool if available.

### Step 2: Derive the team name from the worktree

The team name MUST be scoped to the current worktree for isolation:

```bash
# Get the current worktree directory name or branch name
WORKTREE_NAME=$(basename "$(git rev-parse --show-toplevel)" | sed 's/[^a-zA-Z0-9]/-/g')
TEAM_NAME="micro-devs-${WORKTREE_NAME}"
```

### Step 3: Create the team

Use TeamCreate with the worktree-scoped name:

```
TeamCreate({ team_name: "${TEAM_NAME}", description: "Micro Devs team for gf-vid-chat (worktree: ${WORKTREE_NAME})" })
```

**NEVER use a bare `micro-devs` name.** Always include the worktree suffix to prevent collisions between parallel tasks.

### Step 4: Create the task list

Use TaskCreate to break the user's request into discrete tasks with clear acceptance criteria. Identify:
- Which agents own which tasks
- Dependencies between tasks
- What can run in parallel

### Step 5: Spawn all 8 agents as teammates

Spawn each agent as a **teammate** (NOT a subagent) using the Agent tool with `team_name: "${TEAM_NAME}"`. Use the project-scoped agent definitions in `.claude/agents/`.

**CRITICAL: These are agent team teammates, not subagents.** They run as independent parallel sessions that communicate via the shared task list and messaging. The orchestrator coordinates them but does NOT spawn them as subagents.

| Name | subagent_type | model | Spawn |
|------|--------------|-------|-------|
| `orchestrator` | `micro-devs-orchestrator` | opus | Always first |
| `frontend` | `senior-frontend-dev` | sonnet | On demand |
| `p2p` | `p2p-specialist` | sonnet | On demand |
| `qa` | `qa-e2e` | sonnet | On demand |
| `shipper` | `shipper` | sonnet | On demand |
| `architect` | `principal-architect` | opus | On demand |
| `designer` | `product-designer` | sonnet | On demand |
| `reviewer` | `code-reviewer` | sonnet | Before every PR |

**Always spawn the orchestrator first.** The orchestrator coordinates teammates via messaging and the shared task list.

**The `reviewer` teammate MUST be spawned before any PR is created.** It runs `/codex:review` and iterates in a feedback loop with the implementing teammates until the code scores 10/10.

### Step 6: Brief the orchestrator

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
| UI-only work | orchestrator + designer + frontend + qa + reviewer |
| P2P/video feature | orchestrator + architect + p2p + frontend + qa + reviewer |
| Bug fix (frontend) | orchestrator + frontend + qa + reviewer |
| Bug fix (P2P) | orchestrator + p2p + qa + reviewer |
| Architecture/planning only | orchestrator + architect |
| Deploy/ship only | orchestrator + shipper |
| Full feature | All 8 agents |

**Note:** The `reviewer` is included in every dispatch that produces code. It is NEVER optional when code changes are involved.

## Quality Gate Reminder

Before the team marks work complete, the orchestrator MUST verify:
1. `pnpm type-check` — zero errors
2. `pnpm lint` — zero errors  
3. `pnpm test` — all passing
4. `pnpm build` — successful
5. `code-reviewer` Codex review — **10/10 score** (merge gate, no exceptions)
6. PR created (never push to main)
7. No AI attribution in commits

## Cleanup

When work is complete and the PR is merged:
1. The **team lead** must clean up the team first: `Clean up the team`
2. Then remove the worktree: `git worktree remove ../<worktree-name>`
3. This removes the team's runtime state from `~/.claude/teams/micro-devs-<worktree>/` and `~/.claude/tasks/micro-devs-<worktree>/`

**ALWAYS clean up the team before removing the worktree.** Removing the worktree first orphans the team state.
