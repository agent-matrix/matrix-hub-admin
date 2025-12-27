import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Network,
  Database,
  Activity,
  Settings,
  Box,
  RefreshCw,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import '@/styles/globals.css';

interface Tab {
  id: string;
  label: string;
  icon: any;
  path: string;
}

const TABS: Tab[] = [
  { id: 'catalog', label: 'Catalog', icon: Search, path: '/catalog' },
  { id: 'remotes', label: 'Remotes', icon: Globe, path: '/remotes' },
  { id: 'gateway', label: 'Gateway', icon: Network, path: '/gateway' },
  { id: 'entities', label: 'Entities', icon: Database, path: '/entities' },
  { id: 'health', label: 'Health', icon: Activity, path: '/health' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

// Protected layout component
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated && router.pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthenticated, router, mounted]);

  const activeTab = TABS.find((tab) => router.pathname === tab.path)?.id || 'catalog';
  const activeTabLabel = TABS.find((tab) => tab.id === activeTab)?.label || 'Catalog';

  if (!mounted || (!isAuthenticated && router.pathname !== '/login')) {
    return null;
  }

  // Show login page without layout
  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col transition-colors duration-300">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-full h-96 bg-indigo-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Box className="text-white" size={20} />
              </div>
              <span className="text-lg font-bold tracking-tight">
                MATRIX<span className="text-zinc-500">HUB</span>
              </span>
            </div>

            <nav className="hidden md:flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.path)}
                  className={`
                    px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2
                    ${
                      activeTab === tab.id
                        ? 'bg-white text-black shadow-md transform scale-105'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-white/10 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              v1.4.2
            </div>

            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-white">{user.username}</span>
                  <span className="text-[10px] text-zinc-500">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative z-10 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-mono">
            <span>MATRIX</span>
            <ChevronRight size={12} />
            <span>HUB</span>
            <ChevronRight size={12} />
            <span className="text-white uppercase">{activeTabLabel}</span>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ProtectedLayout>
        <Component {...pageProps} />
      </ProtectedLayout>
    </AuthProvider>
  );
}
