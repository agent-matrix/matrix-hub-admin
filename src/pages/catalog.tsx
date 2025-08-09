import { useState } from "react";
import { hub } from "../lib/api";
import Layout from "../components/Layout";
import { TextField, Button, Stack, Typography, Alert, Box } from "@mui/material";

export default function CatalogPage() {
  const [uid, setUid] = useState("mcp_server:hello-sse-server@0.1.0");
  const [target, setTarget] = useState("./");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [resp, setResp] = useState<any>(null);

  const install = async () => {
    setMsg(""); setErr(""); setResp(null);
    try {
      const { data } = await hub.post("/catalog/install", { id: uid, target });
      setResp(data);
      setMsg("Install requested.");
    } catch (e) {
      setErr("Failed to request install.");
      console.error(e);
    }
  };

  return (
    <Layout breadcrumb={<>Matrix › Hub › <b>Catalog</b></>}>
      <Stack spacing={2} sx={{ maxWidth: 760 }}>
        <Typography variant="h5">Catalog Install</Typography>
        <TextField label="UID (type:name@version)" value={uid} onChange={e=>setUid(e.target.value)} />
        <TextField label="Target path" value={target} onChange={e=>setTarget(e.target.value)} />
        <Button variant="contained" onClick={install}>Install</Button>
        {msg && <Alert severity="success">{msg}</Alert>}
        {err && <Alert severity="error">{err}</Alert>}
        {resp && (
          <Box sx={{
            mt: 1.5, p: 1.5, borderRadius: 1,
            bgcolor: (t) => t.palette.mode === "dark" ? "grey.900" : "grey.100",
            color: (t) => t.palette.text.primary, overflow: "auto", fontFamily: "monospace", fontSize: 13
          }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(resp, null, 2)}</pre>
          </Box>
        )}
      </Stack>
    </Layout>
  );
}
