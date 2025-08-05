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
