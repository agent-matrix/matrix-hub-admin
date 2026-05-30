import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OpsProvider } from '@/components/ops';
import { MatrixBackground } from '@/components/layout/MatrixBackground';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import '@/styles/globals.css';

// Routes that render standalone (no auth, no console chrome).
const PUBLIC_ROUTES = new Set(['/login', '/verify', '/accept-invite']);

// Protected layout: left sidebar (with bottom user dropdown) + content area.
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPublic = PUBLIC_ROUTES.has(router.pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated && !isPublic) {
      router.replace('/login');
    }
  }, [isAuthenticated, router, mounted, isPublic]);

  if (!mounted || (!isAuthenticated && !isPublic)) {
    return null;
  }

  // Public pages render without the console chrome.
  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020403] text-emerald-50 antialiased selection:bg-emerald-300 selection:text-black">
      <MatrixBackground />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="relative z-10 lg:pl-72">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8 lg:py-8">
          <div className="animate-in">{children}</div>
        </div>
      </div>
    </main>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <OpsProvider>
        <ProtectedLayout>
          <Component {...pageProps} />
        </ProtectedLayout>
      </OpsProvider>
    </AuthProvider>
  );
}
