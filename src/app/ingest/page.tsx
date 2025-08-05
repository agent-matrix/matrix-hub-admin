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
