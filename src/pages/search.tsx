import { useState } from "react";
import { useRouter } from "next/router";
import { hub } from "../lib/api";
import { compactParams } from "../lib/query";
import type { SearchResponse, SearchItem, SearchMode, RerankMode, InstallResponse } from "../types/hub";
import {
  Container, TextField, Button, Stack, Typography, Alert, MenuItem, Chip, Card, CardContent,
  CardActions, Grid, Box, Checkbox, FormControlLabel
} from "@mui/material";
import Layout from "../components/Layout";

const TYPES = ["", "agent", "tool", "mcp_server"];
const MODES: SearchMode[] = ["keyword", "semantic", "hybrid"];
const RERANKS: RerankMode[] = ["none", "llm"];

export default function CatalogSearchPage() {
  const r = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [capabilities, setCapabilities] = useState("");
  const [frameworks, setFrameworks] = useState("");
  const [providers, setProviders] = useState("");
  const [mode, setMode] = useState<SearchMode>("hybrid");
  const [rerank, setRerank] = useState<RerankMode>("none");
  const [limit, setLimit] = useState<number>(20);
  const [withRag, setWithRag] = useState<boolean>(false);
  const [target, setTarget] = useState("./");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const search = async () => {
    setMsg(""); setErr(""); setItems([]); setTotal(0);
    if (!q.trim()) { setErr("Please enter a search query."); return; }
    try {
      const params = compactParams({
        q, type: type || undefined, capabilities: capabilities || undefined, frameworks: frameworks || undefined,
        providers: providers || undefined, mode, limit, with_rag: withRag, rerank
      });
      const { data } = await hub.get<SearchResponse>("/catalog/search", { params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr("Search failed.");
      console.error(e);
    }
  };

  const install = async (uid: string) => {
    setMsg(""); setErr("");
    try {
      const { data } = await hub.post<InstallResponse>("/catalog/install", { id: uid, target });
      setMsg(`Install started. Wrote: ${(data.files_written || []).length} files.`);
    } catch (e) {
      setErr("Install request failed.");
      console.error(e);
    }
  };

  return (
    <Layout breadcrumb={<>Matrix › Hub › <b>Catalog Search</b></>}>
      <Container maxWidth="lg" sx={{ py: 2, px: 0 }}>
        <Typography variant="h5" gutterBottom>Catalog Search</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <TextField fullWidth label="Query" value={q} onChange={e=>setQ(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Target path" value={target} onChange={e=>setTarget(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Type" value={type} onChange={e=>setType(e.target.value)}>
              {TYPES.map(t => <MenuItem key={t} value={t}>{t || "(any)"}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Capabilities (csv)" value={capabilities} onChange={e=>setCapabilities(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Frameworks (csv)" value={frameworks} onChange={e=>setFrameworks(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Providers (csv)" value={providers} onChange={e=>setProviders(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Mode" value={mode} onChange={e=>setMode(e.target.value as any)}>
              {MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Rerank" value={rerank} onChange={e=>setRerank(e.target.value as any)}>
              {RERANKS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField type="number" fullWidth label="Limit" inputProps={{ min: 1, max: 100 }} value={limit} onChange={e=>setLimit(Number(e.target.value || 20))} />
          </Grid>
          <Grid item xs={12} md={4} alignItems="center" display="flex">
            <FormControlLabel control={<Checkbox checked={withRag} onChange={e=>setWithRag(e.target.checked)} />} label="Return RAG fit_reason" />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={search}>Search</Button>
              <Button variant="outlined" onClick={()=>{ setQ(""); setItems([]); setTotal(0); }}>Clear</Button>
            </Stack>
          </Grid>
        </Grid>

        {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
        {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Results: {total}</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {items.map((it) => (
              <Grid key={it.id} item xs={12} md={6} lg={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">{it.type}</Typography>
                    <Typography variant="h6" gutterBottom>{it.name} <Box component="span" sx={{ color: "text.secondary", fontSize: 14 }}>@ {it.version}</Box></Typography>
                    <Typography variant="body2" sx={{ minHeight: 48 }}>{it.summary || "—"}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                      {(it.frameworks || []).slice(0, 3).map(f => <Chip key={f} size="small" label={f} />)}
                      {(it.capabilities || []).slice(0, 3).map(c => <Chip key={c} size="small" variant="outlined" label={c} />)}
                    </Stack>
                    {typeof it.score_final === "number" && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        score: {it.score_final?.toFixed(3)}
                      </Typography>
                    )}
                    {it.fit_reason && (
                      <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                        reason: {it.fit_reason}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={()=>r.push(`/entities/${encodeURIComponent(it.id)}`)}>Details</Button>
                    <Button size="small" variant="contained" onClick={()=>install(it.id)}>Install</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
}
