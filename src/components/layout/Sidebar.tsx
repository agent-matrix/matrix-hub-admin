import React from 'react';
import { useRouter } from 'next/router';
import { Box, ChevronRight, X } from 'lucide-react';
import { NAV_ITEMS, NavItem, activeNavId } from './nav';
import { UserMenu } from './UserMenu';

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_30px_rgba(0,255,136,0.16)]">
        <Box className="h-5 w-5 text-emerald-300" />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight text-emerald-50">MatrixHub</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300/55">
          admin console
        </p>
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (path: string) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onSelect(item.path)}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
        active
          ? 'border border-emerald-300/20 bg-emerald-400/12 text-emerald-100 shadow-[0_0_22px_rgba(0,255,136,0.08)]'
          : 'text-emerald-50/58 hover:bg-emerald-400/[0.06] hover:text-emerald-100'
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" /> {item.label}
      </span>
      {active && <ChevronRight className="h-4 w-4 text-emerald-300" />}
    </button>
  );
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const router = useRouter();
  const active = activeNavId(router.pathname);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const nav = (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onSelect={navigate} />
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col bg-gradient-to-b from-black/55 to-black/20 p-4 backdrop-blur-xl lg:flex">
        <Brand />
        <div className="mt-8 flex-1 overflow-y-auto pr-1">{nav}</div>
        {/* User dropdown anchored to the sidebar bottom (ChatGPT / Claude style) */}
        <div className="pt-4">
          <UserMenu />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-80 max-w-[85vw] flex-col border-r border-white/5 bg-[#020403] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-emerald-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto pr-1">{nav}</div>
            <div className="pt-4">
              <UserMenu onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
