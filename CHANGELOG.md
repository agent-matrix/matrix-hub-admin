# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Matrix Cloud Admin design preview** at
  `/preview/agent-matrix/project/index.html`. Ships the design handoff
  bundle (HTML + 4 JSX modules + 35 KB styles.css) as Next.js static
  assets under `public/preview/`. The prototype boots React 18 + Babel
  Standalone from a CDN and renders verbatim — visual spec for the
  upcoming TypeScript port.
- Next.js entry route `/admin/preview` that client-redirects into the
  static prototype, for parity with the Pages Router.
- Standardized repository governance files (SECURITY.md, CONTRIBUTING.md,
  CODE_OF_CONDUCT.md, CODEOWNERS, .editorconfig, .gitattributes) as part of
  the Agent-Matrix alive-system synchronization.

### Notes on the preview

The bundle covers the Mission Control cockpit (Simple/Advanced),
Alive Loop ring diagram, Catalog/Agents tables, Agent-Generator,
SelfRepair, HomePilot, OllaBridge, Infrastructure, Database, Health,
Live Logs, IAM, Env & Secrets (configured/missing only), Policies,
Costs (€0 with sponsor tiers), Links, Settings, Audit, plus a
login screen and session-expired modal. KPIs are honest (€0 spend,
12 catalog items, local-first inference) — no fake dashboards.

The full TypeScript port into Next.js components is a follow-up
PR — the bundle's `agent-matrix/README.md` and `chats/chat1.md`
record the design author's intent.
