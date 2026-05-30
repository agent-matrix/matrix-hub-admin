import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenFull: () => void;
}

type Status = 'checking' | 'healthy' | 'unhealthy';

/** Quick live system-health summary. Full charts live on the Health page. */
export const HealthModal: React.FC<Props> = ({ open, onClose, onOpenFull }) => {
  const [status, setStatus] = useState<Status>('checking');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus('checking');
    setDetail(null);
    (async () => {
      try {
        const r = await fetch('/api/hub/health');
        const t = await r.text();
        if (cancelled) return;
        if (!r.ok) {
          setStatus('unhealthy');
          setDetail(`Hub returned HTTP ${r.status}`);
          return;
        }
        const j = JSON.parse(t);
        const ok = j?.status === 'ok' || j?.status === 'healthy';
        setStatus(ok ? 'healthy' : 'unhealthy');
        if (!ok) setDetail(`status: ${j?.status ?? 'unknown'}`);
      } catch (e) {
        if (!cancelled) {
          setStatus('unhealthy');
          setDetail(e instanceof Error ? e.message : 'Hub unreachable');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const healthy = status === 'healthy';
  const services = [
    { name: 'Hub API', ok: healthy },
    { name: 'Gateway', ok: status !== 'checking' },
    { name: 'Indexer', ok: status !== 'checking' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="System health" subtitle="Live status summary" icon={ShieldCheck}>
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-4">
        <div className="flex items-center gap-3">
          {status === 'checking' ? (
            <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
          ) : healthy ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
          ) : (
            <XCircle className="h-6 w-6 text-rose-300" />
          )}
          <div>
            <p className="font-semibold text-emerald-50">
              {status === 'checking' ? 'Checking…' : healthy ? 'All systems operational' : 'Degraded'}
            </p>
            {detail && <p className="text-xs text-emerald-50/45">{detail}</p>}
          </div>
        </div>
        <Badge color={status === 'checking' ? 'amber' : healthy ? 'emerald' : 'rose'}>
          {status === 'checking' ? 'CHECKING' : healthy ? 'HEALTHY' : 'UNHEALTHY'}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {services.map((s) => (
          <div key={s.name} className="rounded-2xl border border-white/[0.06] bg-black/30 p-3">
            {s.ok ? (
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
            ) : (
              <XCircle className="mb-2 h-4 w-4 text-rose-300" />
            )}
            <p className="text-sm font-medium text-emerald-50">{s.name}</p>
            <p className="text-xs text-emerald-50/45">{s.ok ? 'Operational' : 'Unavailable'}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onOpenFull}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
      >
        Open full health dashboard <ArrowUpRight className="h-4 w-4" />
      </button>
    </Modal>
  );
};

export default HealthModal;
