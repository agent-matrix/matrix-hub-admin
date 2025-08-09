import { useEffect, useState } from "react";
import { hub } from "../../lib/api";
import Link from "next/link";
import {
  Container, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Paper, Stack, TextField, Button
} from "@mui/material";
import Layout from "../../components/Layout";

type CatalogRow = {
  id: string;
  type: string;
  name: string;
  version: string;
  summary?: string | null;
  homepage?: string | null;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
};

type CatalogListResp = { items: CatalogRow[]; total: number };

export default function EntitiesListPage() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    setErr("");
    try {
      const { data } = await hub.get<CatalogListResp>("/catalog");
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr("Failed to load catalog.");
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = !filter.trim()
    ? rows
    : rows.filter((r) => `${r.type}:${r.name}@${r.version}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Layout breadcrumb={<>Matrix › Hub › <b>Entities</b></>}>
      <Container maxWidth="lg" sx={{ py: 2, px: 0 }}>
        <Typography variant="h5" gutterBottom>Entities</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Quick filter (type:name@version)" value={filter} onChange={e=>setFilter(e.target.value)} />
          <Button onClick={load}>Refresh</Button>
          <Button component={Link} href="/search" variant="outlined">Go to Search</Button>
        </Stack>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ fontFamily: "monospace" }}>{e.id}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>{e.version}</TableCell>
                  <TableCell sx={{ maxWidth: 360, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {e.summary || "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="small" component={Link} href={`/entities/${encodeURIComponent(e.id)}`}>Open</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">No items.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          total: {total}
        </Typography>
      </Container>
    </Layout>
  );
}
