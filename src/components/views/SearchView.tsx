import React, { useEffect, useState, useCallback } from 'react';
import { Search, Download, Plus, Eye } from 'lucide-react';
import { Badge, statusColor } from '../ui';

interface Entity {
  id: string;
  name: string;
  version: string;
  type: string;
  summary?: string;
  capability?: string;
  downloads?: string;
  status?: string;
}

const QUICK_TAGS = ['All', 'AGENT', 'SERVER', 'TOOL', 'Payments', 'Database', 'DevOps'];

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Entity[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      setErr(null);
      // Hub search requires `q` param; when empty, use the catalog list endpoint instead
      const url = searchQuery.trim()
        ? `/api/hub/search?q=${encodeURIComponent(searchQuery.trim())}&limit=30`
        : `/api/hub/catalog?limit=30`;
      const r = await fetch(url);
      const t = await r.text();
      if (!r.ok) throw new Error(t);
      const j = JSON.parse(t);
      setItems(j?.items || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="space-y-6">
      {/* Search header */}
      <div className="rounded-[2rem] bg-[#06100B]/45 p-6 shadow-[0_0_70px_rgba(0,255,136,0.05)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-300/65">
              Federated meta-search
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-emerald-50">
              Catalog control
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/55">
              Discover, install, and manage MCP agents, servers, and tools across the federated
              Matrix ecosystem.
            </p>
          </div>
          <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 font-semibold text-black hover:bg-emerald-300">
            <Plus className="h-4 w-4" /> Add entity
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/45 px-4">
          <Search className="h-5 w-5 text-emerald-300" />
          <input
            type="text"
            className="h-14 flex-1 bg-transparent text-emerald-50 outline-none placeholder:text-emerald-300/35"
            placeholder="Search agents, servers, capabilities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag === 'All' ? '' : tag)}
              className="rounded-full border border-white/10 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-100/75 transition hover:bg-emerald-400/10"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="text-sm text-rose-300">Search error: {err}</div>}
      {loading && <div className="text-sm text-emerald-50/55">Loading…</div>}

      {/* Results grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((entity) => (
          <div
            key={entity.id}
            className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.025] p-5 shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-emerald-300/35 hover:shadow-[0_0_50px_rgba(0,255,136,0.1)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-black/45 font-mono text-sm text-emerald-300">
                {(entity.type || 'EN').slice(0, 2)}
              </div>
              <Badge color={statusColor(entity.status)}>
                {entity.status || entity.type || 'ENTITY'}
              </Badge>
            </div>

            <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-emerald-300/55">
              {entity.type || 'ENTITY'} · v{entity.version || '0.0.0'}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-emerald-50">{entity.name}</h3>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-emerald-50/58">
              {entity.summary ||
                `High-performance connector for ${entity.capability || 'general'} operations.`}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4 text-xs text-emerald-50/55">
              {entity.capability && <span>{entity.capability}</span>}
              {entity.downloads && <span>{entity.downloads} downloads</span>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2.5 font-semibold text-black hover:bg-emerald-300">
                <Download className="h-4 w-4" /> Install
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-emerald-100 hover:bg-emerald-400/10">
                <Eye className="h-4 w-4" /> Inspect
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && !err && (
        <div className="py-12 text-center text-emerald-50/45">
          No entities found. Try a different search term.
        </div>
      )}
    </div>
  );
};
