import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check } from 'lucide-react';

type EnvTarget = 'All Environments' | 'Production' | 'Preview' | 'Development';

interface EnvVar {
  id: string;
  key: string;
  value: string;
  target: EnvTarget;
}

const STORAGE_KEY = 'matrix_hub_env_vars';

const DEFAULTS: EnvVar[] = [
  { id: 'env_hub_url', key: 'HUB_PUBLIC_URL', value: 'https://hub.matrix.ai', target: 'All Environments' },
  { id: 'env_gw_mode', key: 'GATEWAY_MODE', value: 'HYBRID', target: 'Production' },
  { id: 'env_db', key: 'DB_CONNECTION', value: 'CONNECTED', target: 'All Environments' },
  { id: 'env_auth', key: 'AUTH_MODE', value: 'LOCAL_ADMIN', target: 'All Environments' },
];

const TARGETS: EnvTarget[] = ['All Environments', 'Production', 'Preview', 'Development'];

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `env_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const fieldClass =
  'h-10 w-full rounded-xl border border-white/[0.06] bg-black/40 px-3 text-sm text-emerald-50 outline-none transition focus:border-emerald-400/40 placeholder:text-emerald-300/30';

/**
 * Vercel-style environment variables manager. Variables can be added, edited,
 * and removed; values can be masked/revealed. Changes persist to localStorage
 * (the hub does not yet expose a server endpoint for project env vars).
 */
export const EnvVarsManager: React.FC = () => {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const hydrated = useRef(false);

  // Load once on mount
  useEffect(() => {
    let initial = DEFAULTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) initial = parsed;
      }
    } catch {
      /* ignore malformed storage */
    }
    setVars(initial);
    hydrated.current = true;
  }, []);

  // Persist whenever vars change (after hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));
    } catch {
      /* storage may be unavailable */
    }
  }, [vars]);

  const addVar = () =>
    setVars((prev) => [...prev, { id: newId(), key: '', value: '', target: 'All Environments' }]);

  const removeVar = (id: string) => setVars((prev) => prev.filter((v) => v.id !== id));

  const updateVar = (id: string, patch: Partial<EnvVar>) =>
    setVars((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const toggleReveal = (id: string) => setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vars.filter((v) => v.key.trim())));
    } catch {
      /* ignore */
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-emerald-50">
            Environment variables
          </h2>
          <p className="mt-1 text-sm text-emerald-50/52">
            Define key–value pairs available to the hub at build and runtime, scoped per
            environment.
          </p>
        </div>
        <button
          onClick={addVar}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-emerald-400/5 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
        >
          <Plus className="h-4 w-4" /> Add another
        </button>
      </div>

      {/* Column labels (desktop) */}
      <div className="mt-6 hidden grid-cols-[1fr_1.2fr_0.9fr_auto] gap-3 px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/45 md:grid">
        <span>Key</span>
        <span>Value</span>
        <span>Environment</span>
        <span className="sr-only">Actions</span>
      </div>

      <div className="space-y-3">
        {vars.length === 0 && (
          <p className="rounded-2xl bg-black/20 px-4 py-6 text-center text-sm text-emerald-50/40">
            No environment variables yet. Add your first one.
          </p>
        )}

        {vars.map((v) => (
          <div
            key={v.id}
            className="grid grid-cols-1 gap-3 rounded-2xl bg-black/20 p-3 md:grid-cols-[1fr_1.2fr_0.9fr_auto] md:items-center md:bg-transparent md:p-0"
          >
            <input
              aria-label="Variable key"
              value={v.key}
              onChange={(e) => updateVar(v.id, { key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              placeholder="EXAMPLE_NAME"
              className={`${fieldClass} font-mono`}
            />

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/40 px-2 focus-within:border-emerald-400/40">
              <input
                aria-label="Variable value"
                type={revealed[v.id] ? 'text' : 'password'}
                value={v.value}
                onChange={(e) => updateVar(v.id, { value: e.target.value })}
                placeholder="value"
                className="h-10 flex-1 bg-transparent font-mono text-sm text-emerald-50 outline-none placeholder:text-emerald-300/30"
              />
              <button
                type="button"
                onClick={() => toggleReveal(v.id)}
                className="text-emerald-200/60 hover:text-emerald-200"
                aria-label={revealed[v.id] ? 'Hide value' : 'Show value'}
              >
                {revealed[v.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <select
              aria-label="Environment target"
              value={v.target}
              onChange={(e) => updateVar(v.id, { target: e.target.value as EnvTarget })}
              className={fieldClass}
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => removeVar(v.id)}
              className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-xl border border-rose-300/12 text-rose-200 transition hover:bg-rose-400/10"
              aria-label="Remove variable"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/5 pt-5">
        <p className="text-xs text-emerald-50/40">
          Stored in this browser. Connect a hub secrets endpoint to sync across environments.
        </p>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(0,255,136,0.16)] transition hover:bg-emerald-300"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default EnvVarsManager;
