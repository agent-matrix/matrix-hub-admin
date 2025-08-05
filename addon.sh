#!/usr/bin/env bash
# =============================================================================
# Add Matrix-Hub Admin Pages (Next.js App Router + Refine)
# - Creates pages: /remotes, /ingest, /catalog (inline + DB-backed install),
#                  /gateway, /health, /settings
# - Adds axios clients (Hub/Gateway) + settings util
# - Adds a top Nav and injects it into layout.tsx
# - Provides .env.local.example for URLs/tokens
# =============================================================================
set -Eeuo pipefail

say()  { printf "\033[36m%s\033[0m\n" "$*"; }
ok()   { printf "\033[32m✔ %s\033[0m\n" "$*"; }
warn() { printf "\033[33m⚠ %s\033[0m\n" "$*"; }
err()  { printf "\033[31m✖ %s\033[0m\n" "$*"; exit 1; }

# --- Sanity checks ---
[ -d src/app ] || err "This doesn't look like a Next.js (App Router) app. Missing src/app."
[ -f package.json ] || err "Missing package.json. Run this at your project root."

# --- Ensure axios is installed ---
if ! npx --yes pkg-ok >/dev/null 2>&1; then :; fi  # no-op, just to avoid NPM warmup delay
if ! node -e "require('./package.json'); process.exit(!(require('./package.json').dependencies||{}).axios ? 1 : 0)" 2>/dev/null; then
  say "Installing axios…"
  npm i axios --silent
  ok "axios installed."
else
  ok "axios already present."
fi

# --- Create lib files ---
say "Writing src/lib/api.ts and src/lib/settings.ts…"
mkdir -p src/lib

cat > src/lib/api.ts <<'EOF'
// src/lib/api.ts
import axios from "axios";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL as string;
const GW_URL  = process.env.NEXT_PUBLIC_GW_URL as string;

export const hub = axios.create({ baseURL: HUB_URL });
export const gw  = axios.create({ baseURL: GW_URL });

hub.interceptors.request.use((config) => {
  const t = typeof window !== "undefined"
    ? (localStorage.getItem("HUB_TOKEN") || process.env.NEXT_PUBLIC_HUB_TOKEN || "")
    : (process.env.NEXT_PUBLIC_HUB_TOKEN || "");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

gw.interceptors.request.use((config) => {
  const t = typeof window !== "undefined"
    ? (localStorage.getItem("GW_TOKEN") || process.env.NEXT_PUBLIC_GW_TOKEN || "")
    : (process.env.NEXT_PUBLIC_GW_TOKEN || "");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
EOF

cat > src/lib/settings.ts <<'EOF'
// src/lib/settings.ts
export const settings = {
  get hubUrl() { return process.env.NEXT_PUBLIC_HUB_URL as string; },
  get gwUrl()  { return process.env.NEXT_PUBLIC_GW_URL as string; },

  get hubToken() {
    return (typeof window !== "undefined" && localStorage.getItem("HUB_TOKEN")) || "";
  },
  set hubToken(v: string) {
    if (typeof window !== "undefined") localStorage.setItem("HUB_TOKEN", v);
  },

  get gwToken() {
    return (typeof window !== "undefined" && localStorage.getItem("GW_TOKEN")) || "";
  },
  set gwToken(v: string) {
    if (typeof window !== "undefined") localStorage.setItem("GW_TOKEN", v);
  },
};
EOF

ok "lib files created."

# --- Create Nav component ---
say "Adding src/components/Nav.tsx…"
mkdir -p src/components
cat > src/components/Nav.tsx <<'EOF'
// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { AppBar, Toolbar, Stack, Button } from "@mui/material";

export default function Nav() {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/catalog">Catalog</Button>
          <Button component={Link} href="/remotes">Remotes</Button>
          <Button component={Link} href="/ingest">Ingest</Button>
          <Button component={Link} href="/gateway">Gateway</Button>
          <Button component={Link} href="/health">Health</Button>
          <Button component={Link} href="/settings">Settings</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
EOF
ok "Nav created."

# --- Inject Nav into layout.tsx (best-effort) ---
LAYOUT="src/app/layout.tsx"
if [ -f "$LAYOUT" ]; then
  if ! grep -q 'components/Nav' "$LAYOUT"; then
    say "Injecting Nav import into src/app/layout.tsx…"
    # Insert import after first import line
    awk '
      NR==1 && /^import / { print; print "import Nav from \"../components/Nav\";"; next }
      { print }
    ' "$LAYOUT" > "$LAYOUT.tmp" && mv "$LAYOUT.tmp" "$LAYOUT" || true
  fi
  if ! grep -q '<Nav />' "$LAYOUT"; then
    say "Injecting <Nav /> into <body> in layout.tsx…"
    # Insert <Nav /> right after <body ...>
    sed -i.bak '0,/<body[^>]*>/{s//&\
        <Nav \/>/}' "$LAYOUT" || true
  fi
  ok "layout.tsx patched (if needed)."
else
  warn "src/app/layout.tsx not found; please add <Nav /> manually in your layout."
fi

# --- Create app routes ---
say "Creating route pages under src/app/*…"
mkdir -p src/app/remotes src/app/ingest src/app/catalog src/app/gateway src/app/health src/app/settings

# Home redirects to /catalog
cat > src/app/page.tsx <<'EOF'
// src/app/page.tsx
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/catalog");
}
EOF

# /remotes
cat > src/app/remotes/page.tsx <<'EOF'
// src/app/remotes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { hub } from "../../lib/api";
import {
  Container, TextField, Button, Stack, Typography, Alert, List, ListItem, ListItemText, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

type RemoteItem = { url: string };
type RemoteListResponse = { items: RemoteItem[]; count: number };

export default function RemotesPage() {
  const [url, setUrl] = useState("");
  const [remotes, setRemotes] = useState<RemoteItem[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const load = async () => {
    setErr("");
    try {
      const { data } = await hub.get<RemoteListResponse>("/remotes");
      setRemotes(data.items || []);
    } catch (e) {
      setErr("Failed to load remotes");
      console.error(e);
    }
  };

  const add = async () => {
    setMsg(""); setErr("");
    try {
      await hub.post("/remotes", { url });
      setMsg("Remote added");
      setUrl("");
      await load();
    } catch (e) {
      setErr("Failed to add remote");
      console.error(e);
    }
  };

  const removeRemote = async (u: string) => {
    setMsg(""); setErr("");
    try {
      await hub.delete("/remotes", { params: { url: u } });
      setMsg("Remote removed");
      await load();
    } catch (e) {
      setErr("Failed to remove remote");
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Remotes</Typography>
      <Stack direction="row" spacing={2}>
        <TextField fullWidth label="Index URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <Button variant="contained" onClick={add}>Add</Button>
      </Stack>
      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

      <Typography variant="h6" sx={{ mt: 3 }}>Configured Remotes</Typography>
      <List dense>
        {remotes.map((r) => (
          <ListItem key={r.url}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => removeRemote(r.url)}>
                <DeleteIcon />
              </IconButton>
            }>
            <ListItemText primary={r.url} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
EOF

# /ingest
cat > src/app/ingest/page.tsx <<'EOF'
// src/app/ingest/page.tsx
"use client";

import { useState } from "react";
import { hub } from "../../lib/api";
import { Container, TextField, Button, Stack, Typography, Alert } from "@mui/material";

export default function IngestPage() {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const runIngest = async () => {
    setMsg(""); setErr("");
    try {
      await hub.post("/ingest", { url: url || null });
      setMsg("Ingest requested. Check Hub logs for details.");
    } catch (e) {
      setErr("Failed to request ingest.");
      console.error(e);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Trigger Ingest</Typography>
      <Stack direction="row" spacing={2}>
        <TextField fullWidth label="Index URL (optional; leave blank to ingest all)" value={url} onChange={e=>setUrl(e.target.value)} />
        <Button variant="contained" onClick={runIngest}>Ingest</Button>
      </Stack>
      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
    </Container>
  );
}
EOF

# /catalog (inline install + DB-backed install)
cat > src/app/catalog/page.tsx <<'EOF'
// src/app/catalog/page.tsx
"use client";

import { useState } from "react";
import { hub } from "../../lib/api";
import {
  Container, TextField, Button, Stack, Typography, Alert, ToggleButtonGroup, ToggleButton
} from "@mui/material";

export default function CatalogPage() {
  const [mode, setMode] = useState<"db"|"inline">("db");
  const [uid, setUid] = useState("mcp_server:hello-sse-server@0.1.0");
  const [version, setVersion] = useState<string>("");
  const [target, setTarget] = useState("./");
  const [manifestText, setManifestText] = useState<string>("{\n  \"type\": \"mcp_server\",\n  \"id\": \"hello-sse-server\",\n  \"version\": \"0.1.0\",\n  \"mcp_registration\": {\n    \"transport\": \"SSE\",\n    \"url\": \"http://127.0.0.1:8000/messages/\"\n  }\n}");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [resp, setResp] = useState<any>(null);

  const submit = async () => {
    setMsg(""); setErr(""); setResp(null);
    try {
      const body: any = { id: uid, target };
      if (mode === "db") {
        if (version) body.version = version;
      } else {
        try {
          body.manifest = JSON.parse(manifestText);
        } catch (e) {
          setErr("Manifest is not valid JSON.");
          return;
        }
      }
      const { data } = await hub.post("/catalog/install", body);
      setResp(data);
      setMsg("Install requested successfully.");
    } catch (e) {
      setErr("Install request failed. See console/logs.");
      console.error(e);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Catalog Install</Typography>

      <ToggleButtonGroup exclusive value={mode} onChange={(_, v) => v && setMode(v)} sx={{ mb: 2 }}>
        <ToggleButton value="db">DB-backed (after ingest)</ToggleButton>
        <ToggleButton value="inline">Inline manifest (quick test)</ToggleButton>
      </ToggleButtonGroup>

      <Stack spacing={2}>
        <TextField label="UID (type:name@version)" value={uid} onChange={e=>setUid(e.target.value)} fullWidth />
        <TextField label="Target path" value={target} onChange={e=>setTarget(e.target.value)} fullWidth />
        {mode === "db" ? (
          <TextField label="(Optional) Version (overrides UID version if provided)" value={version} onChange={e=>setVersion(e.target.value)} />
        ) : (
          <TextField label="Manifest (JSON)" multiline minRows={10} value={manifestText} onChange={e=>setManifestText(e.target.value)} />
        )}
        <Button variant="contained" onClick={submit}>Install</Button>
      </Stack>

      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
      {resp && (
        <pre style={{ marginTop: 16, background: "#111", color: "#eee", padding: 12, borderRadius: 8, overflow: "auto" }}>
{JSON.stringify(resp, null, 2)}
        </pre>
      )}
    </Container>
  );
}
EOF

# /gateway
cat > src/app/gateway/page.tsx <<'EOF'
// src/app/gateway/page.tsx
"use client";

import { useState } from "react";
import { gw } from "../../lib/api";
import { Container, TextField, Button, Stack, Typography, MenuItem, Alert } from "@mui/material";

export default function GatewayPage() {
  const [name, setName] = useState("hello-world-sse");
  const [url, setUrl] = useState("http://127.0.0.1:8000/messages/");
  const [transport, setTransport] = useState("SSE");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const registerServer = async () => {
    setMsg(""); setErr("");
    try {
      // Adjust to your Gateway Admin API path if different:
      await gw.post("/gateways", { name, url, transport, description: "Hello server (SSE)" });
      setMsg("Server registered in Gateway.");
    } catch (e) {
      setErr("Failed to register server.");
      console.error(e);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>MCP Gateway</Typography>
      <Stack spacing={2}>
        <TextField label="Name" value={name} onChange={e=>setName(e.target.value)} />
        <TextField label="URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <TextField label="Transport" select value={transport} onChange={e=>setTransport(e.target.value)}>
          {["SSE","HTTP","STREAMABLEHTTP","STDIO"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={registerServer}>Register Server</Button>
      </Stack>
      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
    </Container>
  );
}
EOF

# /health
cat > src/app/health/page.tsx <<'EOF'
// src/app/health/page.tsx
"use client";

import { useState } from "react";
import { hub, gw } from "../../lib/api";
import { Container, Button, Stack, Typography, Box } from "@mui/material";

export default function HealthPage() {
  const [hubOk, setHubOk] = useState<boolean|null>(null);
  const [gwOk, setGwOk] = useState<boolean|null>(null);

  const checkHub = async () => { try { await hub.get("/health"); setHubOk(true); } catch { setHubOk(false); } };
  const checkGw  = async () => { try { await gw.get("/health");  setGwOk(true); } catch { setGwOk(false); } };

  const status = (v: boolean|null) => v === null ? "-" : v ? "OK" : "DOWN";

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Health</Typography>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" onClick={checkHub}>Check Hub</Button>
          <Box>Hub: {status(hubOk)}</Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" onClick={checkGw}>Check Gateway</Button>
          <Box>Gateway: {status(gwOk)}</Box>
        </Stack>
      </Stack>
    </Container>
  );
}
EOF

# /settings
cat > src/app/settings/page.tsx <<'EOF'
// src/app/settings/page.tsx
"use client";

import { useState } from "react";
import { settings } from "../../lib/settings";
import { Container, TextField, Button, Stack, Typography, Alert } from "@mui/material";

export default function SettingsPage() {
  const [hubToken, setHubToken] = useState(settings.hubToken);
  const [gwToken, setGwToken]   = useState(settings.gwToken);
  const [msg, setMsg] = useState("");

  const save = () => {
    settings.hubToken = hubToken.trim();
    settings.gwToken  = gwToken.trim();
    setMsg("Saved to browser localStorage.");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Settings</Typography>
      <Stack spacing={2}>
        <TextField label="Hub URL" value={settings.hubUrl} disabled fullWidth />
        <TextField label="Gateway URL" value={settings.gwUrl} disabled fullWidth />
        <TextField label="Hub Token" value={hubToken} onChange={e=>setHubToken(e.target.value)} fullWidth />
        <TextField label="Gateway Token" value={gwToken} onChange={e=>setGwToken(e.target.value)} fullWidth />
        <Button variant="contained" onClick={save}>Save</Button>
        {msg && <Alert severity="success">{msg}</Alert>}
      </Stack>
    </Container>
  );
}
EOF

ok "route pages created."

# --- Env template ---
say "Adding .env.local.example…"
cat > .env.local.example <<'EOF'
# --- Matrix-Hub & MCP Gateway (browser-visible) ---
NEXT_PUBLIC_HUB_URL=http://127.0.0.1:7300
NEXT_PUBLIC_HUB_TOKEN=
NEXT_PUBLIC_GW_URL=http://127.0.0.1:4444
NEXT_PUBLIC_GW_TOKEN=
EOF
[ -f .env.local ] || cp .env.local.example .env.local
ok ".env.local (example) ready."

say "All done. Start your dev server:"
echo "  npm run dev"
echo
say "Open these routes:"
echo "  /catalog   - Install (DB-backed or Inline manifest)"
echo "  /remotes   - List/Add/Delete remotes"
echo "  /ingest    - Trigger ingest (one or all)"
echo "  /gateway   - Register MCP server in Gateway"
echo "  /health    - Quick health checks"
echo "  /settings  - Set/rotate tokens"
