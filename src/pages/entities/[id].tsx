import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { hub } from "../../lib/api";
import type { EntityDetail, InstallResponse } from "../../types/hub";
import {
  Container, Typography, Alert, Stack, Chip, Divider, Button, TextField, Box, Link as MuiLink
} from "@mui/material";
import Layout from "../../components/Layout";

export default function EntityDetailPage() {
  const r = useRouter();
  const uid = (r.query.id as string) || "";
  const [data, setData] = useState<EntityDetail | null>(null);
  const [err, setErr] = useState("");
  const [target, setTarget] = useState("./");
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!uid) return;
    setErr("");
    try {
      const { data } = await hub.get<EntityDetail>(`/catalog/entities/${encodeURIComponent(uid)}`);
      setData(data);
    } catch (e) {
      setErr("Failed to fetch entity.");
      console.error(e);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [uid]);

  const title = useMemo(() => data ? `${data.type}:${data.name}@${data.version}` : uid, [data, uid]);

  const install = async () => {
    setMsg(""); setErr("");
    try {
      const { data: resp } = await hub.post<InstallResponse>("/catalog/install", { id: uid, target });
      setMsg(`Install started. Steps: ${(resp.results || []).length}`);
    } catch (e) {
      setErr("Install failed.");
      console.error(e);
    }
  };

  return (
    <Layout breadcrumb={<>Matrix › Hub › <b>Entity</b></>}>
      <Container maxWidth="md" sx={{ py: 2, px: 0 }}>
        <Typography variant="h5" gutterBottom>Entity</Typography>
        <Typography variant="subtitle1" sx={{ fontFamily: "monospace" }}>{title}</Typography>

        {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
        {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

        {data && (
          <>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              {data.frameworks?.map((f) => <Chip key={f} label={f} size="small" />)}
              {data.capabilities?.map((c) => <Chip key={c} label={c} size="small" variant="outlined" />)}
            </Stack>

            <Typography sx={{ mt: 2 }}>{data.summary || "—"}</Typography>

            {data.homepage && (
              <Box sx={{ mt: 1 }}>
                <MuiLink href={data.homepage} target="_blank" rel="noreferrer">Homepage</MuiLink>
              </Box>
            )}
            {data.source_url && (
              <Box>
                <MuiLink href={data.source_url} target="_blank" rel="noreferrer">Manifest Source</MuiLink>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <TextField label="Target path" value={target} onChange={e=>setTarget(e.target.value)} />
              <Button variant="contained" onClick={install}>Install</Button>
              <Button variant="outlined" onClick={()=>r.push("/search")}>Back to Search</Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              created: {new Date(data.created_at).toLocaleString()} | updated: {new Date(data.updated_at).toLocaleString()}
            </Typography>
          </>
        )}
      </Container>
    </Layout>
  );
}
