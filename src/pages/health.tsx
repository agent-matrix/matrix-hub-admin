import * as React from "react";
import { hub, gw } from "../lib/api";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, Button, Stack, Chip, Typography } from "@mui/material";

type R = { ok: boolean; ms: number; at: number };

function StatusCard({ label, onCheck, result, loading }:{
  label: string; onCheck: () => void; result: R | null; loading: boolean;
}) {
  const color = !result ? "default" : result.ok ? "success" : "error";
  const text  = !result ? "—" : result.ok ? "OK" : "DOWN";
  return (
    <Card sx={{ minWidth: 300 }}>
      <CardHeader title={label} action={
        <Button onClick={onCheck} disabled={loading} variant="outlined">
          {loading ? "Checking..." : "Check now"}
        </Button>
      }/>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip color={color as any} label={text} />
          <Typography variant="body2" aria-live="polite" role="status">
            {result ? `Latency ${result.ms} ms • ${new Date(result.at).toLocaleTimeString()}` : "No checks yet"}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function HealthPage() {
  const [hubRes, setHubRes] = React.useState<R|null>(null);
  const [gwRes,  setGwRes]  = React.useState<R|null>(null);
  const [busy, setBusy]     = React.useState<{hub:boolean;gw:boolean}>({hub:false,gw:false});

  const check = async (which: "hub"|"gw") => {
    setBusy(b => ({...b, [which]: true}));
    const start = performance.now();
    try {
      if (which === "hub") await hub.get("/health"); else await gw.get("/health");
      const ms = Math.round(performance.now() - start);
      (which === "hub" ? setHubRes : setGwRes)({ ok: true, ms, at: Date.now() });
    } catch {
      const ms = Math.round(performance.now() - start);
      (which === "hub" ? setHubRes : setGwRes)({ ok: false, ms, at: Date.now() });
    } finally {
      setBusy(b => ({...b, [which]: false}));
    }
  };

  return (
    <Layout breadcrumb={<>Matrix › <b>Health</b></>}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <StatusCard label="Hub"     onCheck={() => check("hub")} result={hubRes} loading={busy.hub}/>
        <StatusCard label="Gateway" onCheck={() => check("gw")}  result={gwRes}  loading={busy.gw}/>
      </Stack>
    </Layout>
  );
}
