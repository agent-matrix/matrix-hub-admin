import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { PageHeader } from '../ui';
import { EnvVarsManager } from './EnvVarsManager';

function TokenRow({
  label,
  value,
  visible,
  setVisible,
}: {
  label: string;
  value: string;
  visible: boolean;
  setVisible: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-emerald-300/55">
        {label}
      </label>
      <div className="flex gap-2 rounded-2xl border border-white/5 bg-black/35 p-2">
        <div className="flex flex-1 items-center gap-2 px-2">
          <KeyRound className="h-4 w-4 text-emerald-300" />
          <input
            readOnly
            value={visible ? value : '••••••••••••••••••••••••'}
            className="h-10 flex-1 bg-transparent font-mono text-sm text-emerald-50/62 outline-none"
          />
        </div>
        <button
          onClick={() => setVisible(!visible)}
          className="rounded-xl border border-white/5 px-3 text-sm text-emerald-100 hover:bg-emerald-400/10"
        >
          {visible ? 'Hide' : 'Reveal'}
        </button>
      </div>
    </div>
  );
}

export const SettingsView: React.FC = () => {
  const [showAdminToken, setShowAdminToken] = useState(false);
  const [showGatewaySecret, setShowGatewaySecret] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operator configuration"
        title="Settings"
        subtitle="Manage authentication secrets and environment variables for the hub."
      />

      <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-emerald-50">
          Authentication tokens
        </h2>
        <p className="mt-1 text-sm text-emerald-50/52">
          Reveal only during secure operator sessions.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TokenRow
            label="Admin API Token"
            value="sk-matrix-admin-xxxxxxxxxxxx"
            visible={showAdminToken}
            setVisible={setShowAdminToken}
          />
          <TokenRow
            label="Gateway Secret"
            value="gw-matrix-router-xxxxxxxxxxx"
            visible={showGatewaySecret}
            setVisible={setShowGatewaySecret}
          />
        </div>
      </div>

      <EnvVarsManager />
    </div>
  );
};
