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
