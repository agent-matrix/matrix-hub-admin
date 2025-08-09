# Matrix-Hub Admin (Refine + Next.js + Auth.js)

Admin UI to operate **Matrix-Hub** and **MCP-Gateway** from the browser.

## Getting Started
```bash
npm install
npm run dev
````

Open [http://localhost:3000](http://localhost:3000)

## Environment

Copy `.env.local.example` to `.env.local` and set auth + API URLs and tokens.

## Extra Admin Features
- **/search** — Hybrid catalog search with filters (type/capabilities/frameworks/providers), RAG fit reasons, rerank mode.
- **/entities** — DB-backed catalog list with quick filter; open detail pages.
- **/entities/[id]** — Full entity view with one-click install.
- **/remotes** — Add/list/delete remotes, **Sync** (ingest + gateway re-affirm), **Ingest All**.

> NOTE: Admin-only endpoints (POST/DELETE) on the Hub require a valid bearer token. Set it in **Settings** in the UI.
