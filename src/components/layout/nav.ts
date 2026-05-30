import {
  Activity,
  Search,
  Globe2,
  Network,
  Database,
  ShieldCheck,
  Settings,
  Users,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Activity, path: '/overview' },
  { id: 'catalog', label: 'Catalog', icon: Search, path: '/catalog' },
  { id: 'remotes', label: 'Remotes', icon: Globe2, path: '/remotes' },
  { id: 'gateway', label: 'Gateway', icon: Network, path: '/gateway' },
  { id: 'entities', label: 'Entities', icon: Database, path: '/entities' },
  { id: 'health', label: 'Health', icon: ShieldCheck, path: '/health' },
  { id: 'users', label: 'Users', icon: Users, path: '/users' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

/** Resolve the active nav item for a given router pathname. */
export function activeNavId(pathname: string): string {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );
  return match?.id ?? 'overview';
}
