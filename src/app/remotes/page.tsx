// src/app/remotes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { hub } from "../../lib/api";
import {
  Container, TextField, Button, Stack, Typography, Alert, List, ListItem, ListItemText, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

type RemoteItem = { url: string };
type RemoteListResponse = { items: RemoteItem[]; count: number };

export default function RemotesPage() {
  const [url, setUrl] = useState("");
  const [remotes, setRemotes] = useState<RemoteItem[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const load = async () => {
    setErr("");
    try {
      const { data } = await hub.get<RemoteListResponse>("/remotes");
      setRemotes(data.items || []);
    } catch (e) {
      setErr("Failed to load remotes");
      console.error(e);
    }
  };

  const add = async () => {
    setMsg(""); setErr("");
    try {
      await hub.post("/remotes", { url });
      setMsg("Remote added");
      setUrl("");
      await load();
    } catch (e) {
      setErr("Failed to add remote");
      console.error(e);
    }
  };

  const removeRemote = async (u: string) => {
    setMsg(""); setErr("");
    try {
      await hub.delete("/remotes", { params: { url: u } });
      setMsg("Remote removed");
      await load();
    } catch (e) {
      setErr("Failed to remove remote");
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Remotes</Typography>
      <Stack direction="row" spacing={2}>
        <TextField fullWidth label="Index URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <Button variant="contained" onClick={add}>Add</Button>
      </Stack>
      {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

      <Typography variant="h6" sx={{ mt: 3 }}>Configured Remotes</Typography>
      <List dense>
        {remotes.map((r) => (
          <ListItem key={r.url}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => removeRemote(r.url)}>
                <DeleteIcon />
              </IconButton>
            }>
            <ListItemText primary={r.url} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
