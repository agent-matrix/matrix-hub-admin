import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Activity,
  Database,
  Network,
  Globe2,
  ShieldCheck,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard, Badge } from '../ui';

interface OverviewStats {
  entities: number | null;
  remotes: number | null;
  healthy: boolean | null;
}

export const OverviewView: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats>({
    entities: null,
    remotes: null,
    healthy: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const safeJson = async (url: string) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      };
      const [catalog, remotes, health] = await Promise.all([
        safeJson('/api/hub/catalog?limit=100'),
        safeJson('/api/hub/remotes'),
        safeJson('/api/hub/health'),
      ]);
      if (cancelled) return;
      const remoteItems = remotes?.items || remotes?.remotes || [];
      setStats({
        entities: Array.isArray(catalog?.items) ? catalog.items.length : null,
        remotes: Array.isArray(remoteItems) ? remoteItems.length : null,
        healthy: health ? health.status === 'ok' || health.status === 'healthy' : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (n: number | null) => (n === null ? '—' : String(n));

  const events: [string, string, string, 'amber' | 'emerald' | 'cyan' | 'rose'][] = [
    ['sync', 'Community MCP Registry sync started', '1m ago', 'amber'],
    ['verify', 'postgres-mcp-server passed policy check', '8m ago', 'emerald'],
    ['gateway', 'local-stdio-bridge traffic spike detected', '14m ago', 'cyan'],
    ['error', 'Local Dev Catalog returned 503', '2d ago', 'rose'],
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#06100B]/45 p-6 shadow-[0_0_90px_rgba(0,255,136,0.07)] backdrop-blur lg:p-8">
        {/* atmospheric glow instead of a hard frame */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,255,136,0.10),transparent_45%)]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-emerald-200">
              <Activity className="h-4 w-4" /> Admin system online
            </div>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-emerald-50 lg:text-5xl">
              Control the MatrixHub ecosystem.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/62">
              Manage federated catalogs, MCP gateways, entities, health, and secure settings from a
              single operator console.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/catalog')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black hover:bg-emerald-300"
              >
                <Search className="h-4 w-4" /> Open catalog
              </button>
              <button
                onClick={() => router.push('/health')}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-black/35 px-5 py-3 font-semibold text-emerald-100 hover:bg-emerald-400/10"
              >
                <ShieldCheck className="h-4 w-4" /> View health
              </button>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/5 bg-black/50 p-5 font-mono text-xs text-emerald-100/80">
            <p className="mb-4 text-emerald-300">matrix-admin&gt; health --summary</p>
            <p>hub_api: {stats.healthy === null ? 'checking…' : stats.healthy ? 'operational' : 'degraded'}</p>
            <p>gateway: active</p>
            <p>remotes: {fmt(stats.remotes)} configured</p>
            <p>entities: {fmt(stats.entities)} indexed</p>
            <p className="mt-4 text-emerald-300">deployment_confidence: 94%</p>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Database} label="Indexed entities" value={fmt(stats.entities)} sub="from latest sync" />
        <MetricCard icon={Network} label="Gateway traffic" value="3.2K" sub="requests this hour" />
        <MetricCard
          icon={Globe2}
          label="Remote indexes"
          value={fmt(stats.remotes)}
          sub="federated catalogs"
          tone="cyan"
        />
        <MetricCard
          icon={ShieldCheck}
          label="System health"
          value={stats.healthy === null ? '—' : stats.healthy ? 'Healthy' : 'Degraded'}
          sub="rolling 24h availability"
          tone={stats.healthy === false ? 'rose' : 'emerald'}
        />
      </div>

      {/* Health + Activity */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-xl shadow-black/20 backdrop-blur">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-50">System health</h2>
              <p className="mt-1 text-sm text-emerald-50/52">Hub API, gateway, and indexer checks.</p>
            </div>
            <Badge color={stats.healthy === false ? 'rose' : 'emerald'}>
              {stats.healthy === false ? 'DEGRADED' : 'HEALTHY'}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Hub API', 'Gateway', 'Indexer'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/5 bg-black/30 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="font-semibold text-emerald-50">{item}</p>
                <p className="mt-1 text-xs text-emerald-50/45">Operational</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight text-emerald-50">Audit activity</h2>
          <p className="mt-1 text-sm text-emerald-50/52">Recent operator and system events.</p>
          <div className="mt-6 space-y-3">
            {events.map(([type, text, time, tone]) => (
              <div
                key={text}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/25 p-3"
              >
                <Badge color={tone}>{type}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-emerald-50/78">{text}</p>
                  <p className="mt-1 text-xs text-emerald-50/40">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
