import { useEffect, useState } from "react";
import { hub } from "../lib/api";
import Link from "next/link";
import {
  Container, TextField, Button, Stack, Typography, Alert, List, ListItem, ListItemText,
  IconButton, Divider, Box
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "../components/Layout";
import type { RemoteItem, RemoteListResponse } from "../types/hub";

export default function RemotesPage() {
  const [url, setUrl] = useState("");
  const [remotes, setRemotes] = useState<RemoteItem[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const { data } = await hub.get<RemoteListResponse>("/remotes");
      setRemotes(data.items || []);
    } catch (e) {
      setErr("Failed to load remotes.");
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    setMsg(""); setErr("");
    try {
      await hub.post("/remotes", { url });
      setUrl("");
      setMsg("Remote added.");
      await load();
    } catch (e) {
      setErr("Failed to add remote.");
      console.error(e);
    }
  };

  const removeOne = async (u: string) => {
    setMsg(""); setErr("");
    try {
      // FastAPI DELETE often expects JSON body
      await hub.delete("/remotes", { data: { url: u } });
      setMsg("Remote removed.");
      await load();
    } catch (e) {
      setErr("Failed to remove remote.");
      console.error(e);
    }
  };

  const syncAll = async () => {
    setMsg(""); setErr("");
    try {
      const { data } = await hub.post("/remotes/sync", {});
      setMsg(`Synced. Ingested: ${data?.ingested?.length ?? 0}${data?.synced ? " | Gateways re-affirmed" : ""}`);
    } catch (e) {
      setErr("Sync failed.");
      console.error(e);
    }
  };

  const ingestAll = async () => {
    setMsg(""); setErr("");
    try {
      await hub.post("/ingest", { url: null });
      setMsg("Ingest triggered for all remotes.");
    } catch (e) {
      setErr("Ingest (all) failed.");
      console.error(e);
    }
  };

  return (
    <Layout breadcrumb={<>Matrix › Hub › <b>Remotes</b></>}>
      <Container maxWidth="md" sx={{ py: 2, px: 0 }}>
        <Typography variant="h5" gutterBottom>Remotes</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField fullWidth label="Index URL" value={url} onChange={e=>setUrl(e.target.value)} />
          <Button variant="contained" onClick={add}>Add</Button>
          <Button variant="outlined" onClick={syncAll}>Sync</Button>
          <Button variant="outlined" onClick={ingestAll}>Ingest All</Button>
        </Stack>

        {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
        {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Configured Remotes</Typography>
        <List dense>
          {remotes.map((r) => (
            <ListItem key={r.url}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => removeOne(r.url)}>
                  <DeleteIcon />
                </IconButton>
              }>
              <ListItemText primary={r.url} />
            </ListItem>
          ))}
          {remotes.length === 0 && (
            <Box sx={{ color: "text.secondary", py: 2 }}>
              No remotes yet. Add one above, or try <Link href="/ingest">Ingest</Link> after setting defaults in the Hub.
            </Box>
          )}
        </List>
      </Container>
    </Layout>
  );
}
