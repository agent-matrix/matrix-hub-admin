# Matrix Cloud Admin — design preview

This directory holds the static design handoff bundle produced by Claude
Design (claude.ai/design) for the Matrix Cloud Admin console. The files
live under `public/` so Next.js serves them as-is; the prototype boots
React + Babel-standalone from a CDN and renders client-side.

## How to view

- Local dev: <http://localhost:3000/preview/agent-matrix/project/index.html>
- Deployed: `<admin-url>/preview/agent-matrix/project/index.html`
- Next.js entry route: `/admin/preview` (client-redirects to the above).

## What's inside

- `project/index.html` — primary file; loads React + Babel and the four
  JSX modules below.
- `project/styles.css` — full visual system: dark surfaces, oklch-tuned
  Matrix green, JetBrains Mono + Geist typography. ~1k lines.
- `project/data.jsx` — navigation + honest mock data (catalog, alive
  loop, services, costs, secrets, policies, links, session).
- `project/ui.jsx` — atom library (`Icon`, `Pill`, `Switch`, `Card`,
  `Spark`, `StatCard`, `Bar`, `MatrixRain`).
- `project/pages.jsx` — 20 pages including the cockpit Mission Control
  (Simple/Advanced), Alive Loop, Catalog, Agents, Agent-Generator,
  SelfRepair, HomePilot, OllaBridge, Infrastructure, Database, Health,
  Live Logs, IAM, Secrets, Policies, Costs, Links, Settings, Audit.
- `project/app.jsx` — app shell, hash router, sidebar with bottom user
  menu, topbar with session-expired modal trigger, login page.

## Status

Visual spec only. Not wired to MatrixHub, Aiven, SelfRepair, or GitHub.
A pixel-perfect TypeScript port into Next.js components is the follow-up
work. See CHANGELOG.md.

The design author's notes that came with the bundle:

> Your job is to recreate them pixel-perfectly in whatever technology
> makes sense for the target codebase (React, Vue, native, whatever
> fits). Match the visual output; don't copy the prototype's internal
> structure unless it happens to fit.
