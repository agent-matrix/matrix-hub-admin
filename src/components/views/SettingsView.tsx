import React, { useState } from 'react';
import { Button, Card } from '../ui';

export const SettingsView: React.FC = () => {
  const [showAdminToken, setShowAdminToken] = useState(false);
  const [showGatewaySecret, setShowGatewaySecret] = useState(false);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Hub Configuration</h2>
      <div className="space-y-6">
        <Card title="Authentication Tokens">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Admin API Token
              </label>
              <div className="flex gap-2">
                <input
                  type={showAdminToken ? 'text' : 'password'}
                  value="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled
                  className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-sm text-zinc-500"
                />
                <Button
                  variant="secondary"
                  onClick={() => setShowAdminToken(!showAdminToken)}
                >
                  {showAdminToken ? 'Hide' : 'Reveal'}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Gateway Secret
              </label>
              <div className="flex gap-2">
                <input
                  type={showGatewaySecret ? 'text' : 'password'}
                  value="gw-xxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled
                  className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-sm text-zinc-500"
                />
                <Button
                  variant="secondary"
                  onClick={() => setShowGatewaySecret(!showGatewaySecret)}
                >
                  {showGatewaySecret ? 'Hide' : 'Reveal'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Environment Variables" className="bg-zinc-900/50">
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-400">HUB_PUBLIC_URL</span>
              <span className="text-white">https://hub.matrix.ai</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-400">GATEWAY_MODE</span>
              <span className="text-white">HYBRID</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-zinc-400">DB_CONNECTION</span>
              <span className="text-emerald-400">CONNECTED</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
