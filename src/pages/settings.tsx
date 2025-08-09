import { useState } from "react";
import Layout from "../components/Layout";
import { settings } from "../lib/settings";
import { Stack, Typography, TextField, Button, Alert } from "@mui/material";

export default function SettingsPage() {
  const [hubToken, setHubToken] = useState(settings.hubToken);
  const [gwToken,  setGwToken]  = useState(settings.gwToken);
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  const save = () => {
    settings.hubToken = hubToken.trim();
    settings.gwToken  = gwToken.trim();
    setMsg("Saved to browser localStorage.");
  };

  const clearTokens = () => {
    try {
      localStorage.removeItem("HUB_TOKEN");
      localStorage.removeItem("GW_TOKEN");
    } catch {}
    setHubToken("");
    setGwToken("");
    setMsg("Cleared.");
  };

  return (
    <Layout breadcrumb={<>Matrix › <b>Settings</b></>}>
      <Stack spacing={2} sx={{ maxWidth: 760 }}>
        <Typography variant="h5">Settings</Typography>
        <TextField label="Hub URL" value={settings.hubUrl} disabled />
        <TextField label="Gateway URL" value={settings.gwUrl} disabled />
        <TextField label="Hub Token" type={show ? "text" : "password"} value={hubToken} onChange={e=>setHubToken(e.target.value)} />
        <TextField label="Gateway Token" type={show ? "text" : "password"} value={gwToken} onChange={e=>setGwToken(e.target.value)} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={save}>Save</Button>
          <Button variant="outlined" onClick={() => setShow(s=>!s)}>{show ? "Hide" : "Show"} tokens</Button>
          <Button color="warning" variant="outlined" onClick={clearTokens}>Clear tokens</Button>
        </Stack>
        {msg && <Alert severity="success">{msg}</Alert>}
        <Typography variant="caption" color="text.secondary">
          Tokens are stored in localStorage. For production use, prefer a server-side proxy with httpOnly cookies.
        </Typography>
      </Stack>
    </Layout>
  );
}
