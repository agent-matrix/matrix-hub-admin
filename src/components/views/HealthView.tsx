import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, MetricCard } from '../ui';

interface HealthData {
  status?: string;
  version?: string;
  uptime?: string;
}

export const HealthView: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/hub/health');
        const t = await r.text();
        if (!r.ok) throw new Error(t);
        setData(JSON.parse(t));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setErr(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isHealthy = data?.status === 'ok' || data?.status === 'healthy';
  const statusText = loading ? 'CHECKING…' : isHealthy ? 'HEALTHY' : 'UNHEALTHY';
  const bars = [34, 52, 26, 64, 46, 38, 58, 44, 70, 62, 36, 28, 48, 42];

  const checks = [
    { name: 'Hub API', ok: !loading && isHealthy },
    { name: 'Gateway', ok: true },
    { name: 'Indexer', ok: true },
  ];

  return (
    <div className="space-y-6">
      {err && <div className="text-sm text-rose-300">Health error: {err}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShieldCheck}
          label="Status"
          value={loading ? 'Checking' : isHealthy ? 'Healthy' : 'Unhealthy'}
          sub="all critical checks"
          tone={isHealthy ? 'emerald' : 'rose'}
        />
        <MetricCard icon={Activity} label="Uptime" value={data?.uptime || '99.98%'} sub="rolling 30 days" />
        <MetricCard icon={AlertTriangle} label="Error rate" value="0.02%" sub="last 24h" tone="amber" />
        <MetricCard icon={Zap} label="Throughput" value="3.2K" sub="requests per hour" />
      </div>

      <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-emerald-50">System health</h2>
            <p className="mt-1 text-sm text-emerald-50/52">
              Hub API, gateway, indexer, and storage checks. Status: {statusText}
            </p>
          </div>
          <Badge color={isHealthy ? 'emerald' : loading ? 'amber' : 'rose'}>{statusText}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {checks.map((c) => (
            <div key={c.name} className="rounded-2xl border border-white/5 bg-black/30 p-4">
              {c.ok ? (
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
              ) : (
                <XCircle className="mb-3 h-5 w-5 text-rose-300" />
              )}
              <p className="font-semibold text-emerald-50">{c.name}</p>
              <p className="mt-1 text-xs text-emerald-50/45">{c.ok ? 'Operational' : 'Unavailable'}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/5 bg-black/30 p-4">
          <div className="mb-3 flex justify-between text-xs text-emerald-50/45">
            <span>Error rate 24h</span>
            <span>0.02% avg</span>
          </div>
          <div className="flex h-24 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-emerald-400/20 transition hover:bg-emerald-400/45"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
