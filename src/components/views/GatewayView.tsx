import React, { useState } from 'react';
import { Plus, Settings, Network, CheckCircle, AlertCircle, Loader2, Zap, Server } from 'lucide-react';
import { Button, Badge, MetricCard, statusColor } from '../ui';
import { MOCK_GATEWAY } from '@/lib/mockData';

interface MCPRegistrationForm {
  transport: 'SSE' | 'STDIO' | 'WEBSOCKET' | 'HTTP';
  url: string;
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string;
}

const initialFormState: MCPRegistrationForm = {
  transport: 'SSE',
  url: '',
  id: '',
  name: '',
  version: '0.1.0',
  description: '',
  capabilities: '',
};

const fieldClass =
  'w-full rounded-xl border border-white/[0.06] bg-black/45 p-2.5 text-sm text-emerald-50 outline-none transition focus:border-emerald-400/50 placeholder:text-emerald-300/30';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/55';

export const GatewayView: React.FC = () => {
  const [formData, setFormData] = useState<MCPRegistrationForm>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registeredServers, setRegisteredServers] = useState(MOCK_GATEWAY);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!formData.id || !formData.name || !formData.url) {
        throw new Error('Please fill in all required fields (ID, Name, URL)');
      }

      const payload = {
        endpoint: {
          transport: formData.transport,
          url: formData.url,
        },
        id: formData.id,
        name: formData.name,
        version: formData.version,
        description: formData.description,
        capabilities: formData.capabilities
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
      };

      // Call through the admin API proxy (adds server-side auth token)
      const response = await fetch('/api/hub/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      const newServer = {
        id: result.uid || formData.id,
        name: formData.name,
        transport: formData.transport,
        url: formData.url,
        status: 'ACTIVE' as const,
      };

      setRegisteredServers((prev) => [newServer, ...prev]);
      setMessage({
        type: 'success',
        text: `Successfully registered ${formData.name}! UID: ${result.uid}`,
      });
      setFormData(initialFormState);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to register MCP server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = registeredServers.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = registeredServers.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Network} label="Active bridges" value={activeCount} sub="MCP server routes online" />
        <MetricCard icon={Zap} label="Traffic" value="3.2K" sub="requests this hour" />
        <MetricCard
          icon={Server}
          label="Inactive nodes"
          value={inactiveCount}
          sub="paused connections"
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-50">Gateway routes</h2>
              <p className="mt-1 text-sm text-emerald-50/52">
                Active MCP server bridges and connection pools.
              </p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() =>
                document
                  .getElementById('registration-form')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Register server
            </Button>
          </div>

          <div className="grid gap-4">
            {registeredServers.map((gw) => (
              <div
                key={gw.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-white/[0.06] bg-white/[0.025] p-4 backdrop-blur transition hover:border-emerald-300/30"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                      gw.status === 'ACTIVE'
                        ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300'
                        : 'border-zinc-300/10 bg-zinc-400/10 text-zinc-400'
                    }`}
                  >
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-50">{gw.name}</span>
                      <Badge color="cyan">{gw.transport}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-emerald-50/45">{gw.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge color={statusColor(gw.status)}>{gw.status}</Badge>
                  <button className="rounded-xl border border-white/[0.06] p-2 text-emerald-200 transition hover:bg-emerald-400/10">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div
            id="registration-form"
            className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur"
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">
              Register new MCP server
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {message && (
                <div
                  className={`flex items-start gap-2 rounded-xl border p-3 ${
                    message.type === 'success'
                      ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                      : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-xs">{message.text}</span>
                </div>
              )}

              <div>
                <label className={labelClass}>Transport type *</label>
                <select
                  name="transport"
                  value={formData.transport}
                  onChange={handleInputChange}
                  className={fieldClass}
                  required
                >
                  <option value="SSE">SSE (Server-Sent Events)</option>
                  <option value="STDIO">STDIO (Local Process)</option>
                  <option value="WEBSOCKET">WebSocket</option>
                  <option value="HTTP">HTTP</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Endpoint URL *</label>
                <input
                  type="text"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className={`${fieldClass} font-mono`}
                  placeholder="http://10.0.0.12:8080"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Server ID *</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  className={`${fieldClass} font-mono`}
                  placeholder="hello-sse-server"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Server name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldClass}
                  placeholder="Hello SSE Server"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Version</label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  className={`${fieldClass} font-mono`}
                  placeholder="0.1.0"
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`${fieldClass} resize-none`}
                  placeholder="Describe your MCP server..."
                  rows={3}
                />
              </div>

              <div>
                <label className={labelClass}>Capabilities</label>
                <input
                  type="text"
                  name="capabilities"
                  value={formData.capabilities}
                  onChange={handleInputChange}
                  className={fieldClass}
                  placeholder="search, files, database"
                />
                <p className="mt-1 text-xs text-emerald-50/40">Comma-separated list of capabilities</p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                type="submit"
                disabled={isSubmitting}
                icon={isSubmitting ? Loader2 : undefined}
              >
                {isSubmitting ? 'Registering…' : 'Register MCP server'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
