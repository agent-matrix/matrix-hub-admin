import { useState } from "react";
import { hub } from "../lib/api";
import Layout from "../components/Layout";
import { TextField, Button, Stack, Typography, Alert } from "@mui/material";

export default function IngestPage() {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");

  const runIngest = async () => {
    setMsg(""); setErr("");
    try { await hub.post("/ingest", { url: url || null }); setMsg("Ingest requested."); }
    catch (e) { setErr("Failed to request ingest."); console.error(e); }
  };

  return (
    <Layout breadcrumb={<>Matrix › Hub › <b>Ingest</b></>}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ maxWidth: 760 }}>
        <TextField fullWidth label="Index URL (optional; blank = all)" value={url} onChange={e=>setUrl(e.target.value)} />
        <Button variant="contained" onClick={runIngest}>Ingest</Button>
      </Stack>
      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
    </Layout>
  );
}
