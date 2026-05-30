import React, { useState } from 'react';
import { KeyRound, Copy, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TokenDef {
  label: string;
  env: string;
  value: string;
}

const TOKENS: TokenDef[] = [
  { label: 'Admin API Token', env: 'HUB_API_TOKEN', value: 'sk-matrix-admin-xxxxxxxxxxxx' },
  { label: 'Gateway Secret', env: 'GATEWAY_SECRET', value: 'gw-matrix-router-xxxxxxxxxxx' },
  { label: 'Session Secret', env: 'AUTH_SECRET', value: 'as-matrix-session-xxxxxxxxxx' },
];

function TokenRow({ def }: { def: TokenDef }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(def.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/55">
          {def.label}
        </span>
        <span className="font-mono text-[11px] text-emerald-50/35">{def.env}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.06] bg-black/40 px-3">
          <KeyRound className="h-4 w-4 text-emerald-300" />
          <input
            readOnly
            value={visible ? def.value : '•'.repeat(24)}
            className="h-10 flex-1 bg-transparent font-mono text-sm text-emerald-50/75 outline-none"
          />
        </div>
        <button
          onClick={() => setVisible((v) => !v)}
          className="h-10 rounded-xl border border-white/10 px-3 text-sm text-emerald-100 transition hover:bg-emerald-400/10"
        >
          {visible ? 'Hide' : 'Reveal'}
        </button>
        <button
          onClick={copy}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-emerald-100 transition hover:bg-emerald-400/10"
          aria-label="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/** Quick reveal/copy of operator secrets (placeholders; real values live in env). */
export const TokensModal: React.FC<Props> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tokens & secrets"
      subtitle="Reveal only during secure operator sessions"
      icon={KeyRound}
    >
      <div className="space-y-3">
        {TOKENS.map((t) => (
          <TokenRow key={t.env} def={t} />
        ))}
      </div>
      <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/70">
        These are display placeholders. Actual secrets are configured as server-side environment
        variables and are never exposed to the browser. Manage them in your host (Vercel) or
        <span className="font-mono"> .env.local</span>.
      </p>
    </Modal>
  );
};

export default TokensModal;
