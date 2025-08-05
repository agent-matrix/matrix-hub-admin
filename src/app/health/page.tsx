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
