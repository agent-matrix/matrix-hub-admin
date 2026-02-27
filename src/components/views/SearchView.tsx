import React, { useEffect, useState, useCallback } from 'react';
import { Search, Download, Box } from 'lucide-react';
import { Button, Badge } from '../ui';

interface Entity {
  id: string;
  name: string;
  version: string;
  type: string;
  summary?: string;
  capability?: string;
  downloads?: string;
}

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
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-transparent p-8 rounded-2xl border border-blue-500/10 flex flex-col items-center justify-center text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Matrix Catalog</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Discover, install, and manage MCP agents and servers across the
            federated Matrix ecosystem.
          </p>
        </div>

        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-zinc-500" size={20} />
          </div>
          <input
            type="text"
            className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-xl"
            placeholder="Search for agents, tools, or servers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {['Finance', 'DevOps', 'Databases', 'Productivity', 'Security'].map(
            (tag) => (
              <button
                key={tag}
                className="px-3 py-1 rounded-full bg-zinc-800/50 border border-white/5 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
              >
                {tag}
              </button>
            )
          )}
        </div>
      </div>

      {err && (
        <div className="text-rose-400 text-sm">Search error: {err}</div>
      )}

      {loading && (
        <div className="text-zinc-400 text-sm">Loading...</div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((entity) => (
          <div
            key={entity.id}
            className="group bg-zinc-900 border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-900/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Box size={20} />
              </div>
              <Badge color="zinc">{entity.type || 'UNKNOWN'}</Badge>
            </div>

            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
              {entity.name}
            </h3>
            <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
              {entity.summary || `High-performance connector for ${entity.capability || 'general'} operations.`}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-xs text-zinc-500 font-mono">
                v{entity.version || '0.0.0'} {entity.downloads ? `• ${entity.downloads} installs` : ''}
              </div>
              <Button variant="secondary" className="!py-1.5 !px-3 !text-[10px]">
                <Download size={12} className="mr-1" /> Install
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && !err && (
        <div className="text-center text-zinc-500 py-12">
          No entities found. Try a different search term.
        </div>
      )}
    </div>
  );
};
