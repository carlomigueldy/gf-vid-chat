# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.
AGENTS.md MUST always be an exact copy of this file.

## Project

gf-vid-chat — P2P video chat app for couples. Auto-reconnecting, QR-code-based, no accounts needed. Built for sleeping couples who don't want to wake up to re-dial when internet drops.

## Harness Engineering Rules

These rules are MANDATORY. Some are ENFORCED by hooks in `.claude/settings.json`.

### Git Workflow

- NEVER push directly to main branch. All work goes through PRs.
- ALWAYS create a new git worktree when starting any task:
  `git worktree add ../gf-vid-chat-<task-name> -b feat/<task-name>`
- ALWAYS create a PR after work is done in a worktree: `gh pr create`
- After merge, clean up: `git worktree remove ../gf-vid-chat-<task-name>`
- NEVER work on main directly. If on main, create a branch immediately.

### Commit Rules

- **Commit author MUST be the currently authenticated GitHub CLI account.**
  Before committing, resolve the author identity in this order:
  1. Run `gh auth status` to get the authenticated GitHub username and email.
  2. Use that as the commit author: `git commit --author="Name <email>"`.
  3. If `gh auth status` fails, fall back to `git config user.name` / `git config user.email`.
  4. NEVER use an LLM model (Claude, GPT, Copilot, etc.) as commit author or co-author.
- NEVER include Co-Authored-By lines for AI models.
- NEVER include any code attribution for LLM models in commits or code comments.
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `perf:`
- Keep commit messages concise. Focus on the "why".

### Agent Orchestration

- NEVER work on everything solo. Delegate to specialist agents.
- Use `/spawn-micro-devs` to spawn the Micro Devs agent team for any non-trivial task.
- Agent definitions live in `.claude/agents/` (project-scoped, checked into the repo).
- ALWAYS spawn agents as **teammates** (independent parallel sessions), NOT subagents.
- ALWAYS handoff to specialized teammates for their domain:
  - Frontend (`senior-frontend-dev`, Sonnet): UI components, styling, layout
  - P2P (`p2p-specialist`, Sonnet): WebRTC, PeerJS, media streams
  - Testing (`qa-e2e`, Sonnet): Unit tests, integration tests, e2e
  - Shipping (`shipper`, Sonnet): CI/CD, Vercel deployment
  - Architecture (`principal-architect`, Opus): System design, tech strategy
  - Design (`product-designer`, Sonnet): UI/UX, Figma, design system
  - Code Review (`code-reviewer`, Sonnet 4.6): Codex-powered review, 10/10 gate
  - Orchestrator (`micro-devs-orchestrator`, Opus): Planning, coordination
- ALWAYS pass full context during agent handoffs.
- Use relevant skills as much as possible — check available skills before starting.

### Agent Team Scoping

- Agent teams are **scoped to the current worktree** for isolation.
- Team name format: `micro-devs-<worktree-name>` (NEVER bare `micro-devs`).
- Each worktree gets its own team instance, task list, and mailbox.
- Parallel worktrees can run independent teams without collision.
- ALWAYS clean up the team before removing the worktree.
- Cleanup order: shut down teammates → team lead cleans up → remove worktree.

### Quality Gates

- ALWAYS have all tests passing before creating a PR. Fix flaky tests immediately.
- Use mocking or stubs when relevant (external APIs, databases, timers).
- ALWAYS ensure Vercel deployments deploy successfully. Check status after PR.
- ALWAYS write Clean Code: Maintainable, Scalable, Refactorable.
- NEVER deliver unstable or low-quality work.
- Run verification loops: type check -> lint -> test -> build -> deploy check.

### Security

- NEVER expose sensitive secrets or credentials in code, commits, or files.
- NEVER write real secrets to .env files. Use .env.example with placeholders.
- NEVER implement anything that injects malicious scripts.
- Secret scanning runs automatically via hooks.

### Token Optimization

- ALWAYS optimize token usage. Be concise in responses and code.
- ALWAYS /compact mid-task at natural breakpoints to save context.
- Use project-scoped memory files to persist context across sessions.
- Read memory files at session start; update at session end.

### Documentation & Context

- ALWAYS update project documentation and context files after significant work.
- ALWAYS sync AGENTS.md with CLAUDE.md — they must be exact copies.
  After any edit to CLAUDE.md: `cp CLAUDE.md AGENTS.md`
- Use project-scoped memory at:
  `~/.claude/projects/-home-carlomigueldy-personal-gf-vid-chat/memory/`

### Orchestration Loops

- **Planning loop**: Plan -> Implement -> Verify -> Document -> PR
- **Verification loop**: Type check -> Lint -> Test -> Build -> Deploy check
- **Feedback loop**: PR review -> Address all comments -> Re-request review
- Everything must be 10/10 before marking complete.

## Commands

```
pnpm install        # Install dependencies
pnpm dev            # Start dev server
pnpm build          # Production build (tsc + vite build)
pnpm test           # Run tests (vitest)
pnpm test:watch     # Run tests in watch mode
pnpm lint           # Lint check (eslint)
pnpm type-check     # TypeScript check (tsc --noEmit)
```

## Architecture

Pure client-side SPA deployed to Vercel. No backend, no database.

**Tech Stack**: Vite + React 19 + TypeScript + Tailwind v4 + ShadcnUI patterns + Framer Motion
**WebRTC**: PeerJS (includes free cloud signaling server — zero backend needed)
**QR Code**: qrcode.react (render) + jsQR (decode from image) + html5-qrcode (camera scan)
**Routing**: react-router-dom v7

### Key Flows
- **Room creation**: Creator generates room ID → shows QR code → waits for joiner
- **Room joining**: Joiner scans/uploads QR or pastes link → auto-connects to creator
- **Auto-reconnect**: Exponential backoff (1s→30s cap), configurable timeout (default 1hr), full peer cleanup on each retry
- **Theme**: Light/dark/system via CSS variables + class strategy

### Critical Files
1. `src/hooks/use-peer.ts` — Auto-reconnect state machine (most complex)
2. `src/pages/room-page.tsx` — Orchestrates peer + media + UI
3. `src/hooks/use-media-stream.ts` — Camera lifecycle + cleanup
4. `src/components/qr/qr-upload.tsx` — Canvas + jsQR decode
5. `src/lib/peer-config.ts` — PeerJS + STUN config

### Docs
- **Full implementation plan**: `docs/IMPLEMENTATION_PLAN.md`
  - File structure, package list, core flows, state machine, animation plan
  - Implementation phases with time estimates
  - Verification checklist
