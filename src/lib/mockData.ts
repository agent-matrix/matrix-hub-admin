export interface Remote {
  id: string;
  url: string;
  status: 'SYNCED' | 'SYNCING' | 'ERROR';
  last_sync: string;
  items: number;
}

export interface Entity {
  id: string;
  name: string;
  version: string;
  type: 'AGENT' | 'SERVER' | 'TOOL';
  capability: string;
  downloads: string;
}

export interface Gateway {
  id: string;
  name: string;
  transport: 'SSE' | 'STDIO' | 'WEBSOCKET' | 'HTTP';
  url: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const MOCK_REMOTES: Remote[] = [
  {
    id: 'rem_1',
    url: 'https://index.matrix.ai/v1/catalog',
    status: 'SYNCED',
    last_sync: '2m ago',
    items: 142,
  },
  {
    id: 'rem_2',
    url: 'https://community.mcp.io/registry',
    status: 'SYNCING',
    last_sync: '1h ago',
    items: 850,
  },
  {
    id: 'rem_3',
    url: 'http://localhost:8080/local-dev',
    status: 'ERROR',
    last_sync: '2d ago',
    items: 0,
  },
];

export const MOCK_ENTITIES: Entity[] = [
  {
    id: 'ent_1',
    name: 'stripe-payment-agent',
    version: '1.2.0',
    type: 'AGENT',
    capability: 'Payments',
    downloads: '1.2k',
  },
  {
    id: 'ent_2',
    name: 'postgres-mcp-server',
    version: '2.1.0',
    type: 'SERVER',
    capability: 'Database',
    downloads: '5.4k',
  },
  {
    id: 'ent_3',
    name: 'slack-notifier',
    version: '0.9.5',
    type: 'TOOL',
    capability: 'Communication',
    downloads: '890',
  },
  {
    id: 'ent_4',
    name: 'github-pr-manager',
    version: '1.0.0',
    type: 'AGENT',
    capability: 'DevOps',
    downloads: '2.1k',
  },
  {
    id: 'ent_5',
    name: 'linear-issue-tracker',
    version: '1.1.2',
    type: 'SERVER',
    capability: 'Productivity',
    downloads: '1.5k',
  },
];

export const MOCK_GATEWAY: Gateway[] = [
  {
    id: 'gw_1',
    name: 'primary-mcp-router',
    transport: 'SSE',
    url: 'http://localhost:3000/sse',
    status: 'ACTIVE',
  },
  {
    id: 'gw_2',
    name: 'local-stdio-bridge',
    transport: 'STDIO',
    url: 'N/A',
    status: 'ACTIVE',
  },
  {
    id: 'gw_3',
    name: 'remote-inference-node',
    transport: 'SSE',
    url: 'https://api.matrix.ai/llm',
    status: 'INACTIVE',
  },
];
