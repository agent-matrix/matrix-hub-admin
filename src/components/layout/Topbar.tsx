import React from 'react';
import { useRouter } from 'next/router';
import { Menu, Rocket } from 'lucide-react';
import { NAV_ITEMS, activeNavId } from './nav';
import { useOps } from '@/components/ops';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const router = useRouter();
  const { openPublish } = useOps();
  const active = activeNavId(router.pathname);
  const label = NAV_ITEMS.find((item) => item.id === active)?.label ?? 'Overview';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-black/40 to-transparent backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="rounded-xl border border-white/10 p-2 text-emerald-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/55">
              Current module
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-emerald-50">{label}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/40 px-3 py-2 text-xs text-emerald-50/60 sm:flex">
            <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
            system online
          </div>
          <button
            onClick={() => openPublish()}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_24px_rgba(0,255,136,0.16)] transition hover:bg-emerald-300"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
