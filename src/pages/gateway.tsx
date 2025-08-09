import { useState } from "react";
import { gw } from "../lib/api";
import Layout from "../components/Layout";
import { TextField, Button, Stack, Typography, MenuItem, Alert } from "@mui/material";

export default function GatewayPage() {
  const [name, setName] = useState("hello-world-sse");
  const [url, setUrl] = useState("http://127.0.0.1:8000/messages/");
  const [transport, setTransport] = useState("SSE");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");

  const registerServer = async () => {
    setMsg(""); setErr("");
    try { await gw.post("/gateways", { name, url, transport, description: "Hello server (SSE)" }); setMsg("Server registered."); }
    catch (e) { setErr("Failed to register server."); console.error(e); }
  };

  return (
    <Layout breadcrumb={<>Matrix › Gateway › <b>Register</b></>}>
      <Stack spacing={2} sx={{ maxWidth: 760 }}>
        <Typography variant="h5">MCP Gateway</Typography>
        <TextField label="Name" value={name} onChange={e=>setName(e.target.value)} />
        <TextField label="URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <TextField label="Transport" select value={transport} onChange={e=>setTransport(e.target.value)}>
          {["SSE","HTTP","STREAMABLEHTTP","STDIO"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={registerServer}>Register Server</Button>
        {msg && <Alert severity="success">{msg}</Alert>}
        {err && <Alert severity="error">{err}</Alert>}
      </Stack>
    </Layout>
  );
}
