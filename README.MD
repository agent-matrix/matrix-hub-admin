# Matrix-Hub Admin (Refine + Next.js + Auth.js)

Admin UI to operate **Matrix-Hub** and **MCP-Gateway** from the browser.

## Features
- Add Remote index → Ingest → Install (executes `mcp_registration` → registers in Gateway)
- Register server directly in Gateway (SSE/HTTP/StreamableHTTP/Stdio)
- Health checks for Hub & Gateway
- Settings page to store tokens in localStorage
- Auth.js (NextAuth) Credentials login (ADMIN_USER / ADMIN_PASS)

## Getting Started
```bash
npm install
npm run dev
```
Visit http://localhost:3000 — you’ll be redirected to **/login**. Use env credentials.

### Environment
Copy `.env.local.example` → `.env.local` and set:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
ADMIN_USER=admin
ADMIN_PASS=admin123
NEXT_PUBLIC_HUB_URL=http://127.0.0.1:7300
NEXT_PUBLIC_GW_URL=http://127.0.0.1:4444
# Optional: tokens can be set at runtime in Settings
NEXT_PUBLIC_HUB_TOKEN=
NEXT_PUBLIC_GW_TOKEN=
```

## Docker
```bash
make docker-build
make docker-run APP_PORT=8080
```

## Notes
- For security, consider moving tokens to a backend proxy or using server-side routes.
- Ensure Hub/Gateway CORS allow the frontend origin.
- Replace Credentials auth with your preferred provider later (GitHub/Google/OIDC).
