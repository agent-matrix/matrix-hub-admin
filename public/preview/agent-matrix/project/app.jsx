/* global React, ReactDOM, window */
// ============================================================
// Matrix Cloud Admin — app shell + router
// ============================================================
const { useState, useEffect } = React;
const { Icon, Pill, MatrixRain } = window.MATRIX_UI;
const { NAV, SESSION } = window.MATRIX_DATA;
const P = window.MATRIX_PAGES;

// route → component map (Agent-Matrix ecosystem)
const PAGES = {
  overview:       { c: P.PageOverview,    label: "Mission Control" },
  alive:          { c: P.PageAliveLoop,   label: "Alive Loop" },
  links:          { c: P.PageLinks,       label: "Links" },
  catalog:        { c: P.PageCatalog,     label: "Catalog" },
  agents:         { c: P.PageAgents,      label: "Agents" },
  generator:      { c: P.PageGenerator,   label: "Agent-Generator" },
  selfrepair:     { c: P.PageSelfRepair,  label: "SelfRepair" },
  homepilot:      { c: P.PageHomePilot,   label: "HomePilot" },
  ollabridge:     { c: P.PageOllaBridge,  label: "OllaBridge" },
  infrastructure: { c: P.PageInfra,       label: "Infrastructure" },
  database:       { c: P.PageDatabase,    label: "Database" },
  health:         { c: P.PageHealth,      label: "Health & SLO" },
  logs:           { c: P.PageLogs,        label: "Live Logs" },
  iam:            { c: P.PageIAM,         label: "IAM & Roles" },
  secrets:        { c: P.PageSecrets,     label: "Env & Secrets" },
  policies:       { c: P.PagePolicies,    label: "Policies" },
  audit:          { c: P.PageAudit,       label: "Audit Trail" },
  costs:          { c: P.PageCosts,       label: "Costs & Budget" },
  settings:       { c: P.PageSettings,    label: "Settings" },
  support:        { c: () => <P.PageStub title="Support" sub="open a GitHub issue · or sponsor via tiers in Costs & Budget" />, label: "Support" },
};

function Topbar({ route, onShowSession }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark"><BrandLogo /></div>
        <div>
          <div className="brand-name">MATRIX <span style={{ color: "var(--grn-1)" }}>CLOUD</span></div>
          <div className="brand-sub">{SESSION.user.tenant} · admin</div>
        </div>
      </div>
      <div className="crumbs">
        <span>tenant</span><span className="sep">/</span>
        <span>{SESSION.user.tenant}</span><span className="sep">/</span>
        <span className="here">{(PAGES[route] || PAGES.overview).label}</span>
      </div>
      <div className="grow" />
      <div className="search" role="search">
        <Icon name="search" color="var(--fg-3)" />
        <span style={{ color: "var(--fg-3)" }}>jack in — search catalog, services, secrets…</span>
        <span className="grow" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="env-pill"><span className="dot" /> {SESSION.environment.stage} · {SESSION.environment.name}</div>
      <button className="btn icon ghost" title="Simulate session-expired modal" onClick={onShowSession}>
        <Icon name="lock" />
      </button>
      <button className="btn icon ghost" title="Alerts" style={{ position: "relative" }}>
        <Icon name="bell" />
        <span style={{
          position: "absolute", top: 3, right: 3, width: 6, height: 6, borderRadius: 999,
          background: "var(--amber-1)", boxShadow: "0 0 6px var(--amber-1)"
        }} />
      </button>
    </div>
  );
}

function BrandLogo() {
  return (
    <svg viewBox="0 0 22 22" width="22" height="22" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.92 0.14 145)" />
          <stop offset="100%" stopColor="oklch(0.55 0.16 230)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="19" height="19" rx="4" stroke="url(#lg)" strokeWidth="1.4" fill="none" />
      <path d="M5 16V6l3 5 3-5v10M14 6v10M14 6l3 3M14 10l3-3" stroke="url(#lg)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtClock(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function Sidebar({ route, onNav, onSignOut }) {
  return (
    <div className="sidebar">
      <div className="sidebar-scroll">
        {NAV.map((g, gi) => (
          <div key={g.group}>
            <div className="group-label">{g.group}</div>
            {g.items.map((it, ii) => {
              const idx = String(gi * 10 + ii + 1).padStart(2, "0");
              const active = route === it.id;
              return (
                <div
                  key={it.id}
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => onNav(it.id)}
                >
                  <span className="num">{idx}</span>
                  <span className="ico"><Icon name={it.icon} /></span>
                  <span>{it.label}</span>
                  {it.badge && (
                    <span className={`badge ${it.badge.kind === "warn" ? "" : it.badge.kind}`}>{it.badge.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div className="sidebar-build">
          v0.1.0 · build a7e3f9 · {new Date().toISOString().slice(0,10)}
        </div>
      </div>
      <UserAccountButton onNav={onNav} onSignOut={onSignOut} />
    </div>
  );
}

function UserAccountButton({ onNav, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => fmtClock(new Date()));
  const wrapRef = React.useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(fmtClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sections = [
    {
      label: "Account",
      items: [
        { label: "Account settings",      icon: "cog",    route: "settings" },
        { label: "Organization settings", icon: "users",  route: "settings" },
        { label: "Switch tenant",         icon: "branch", kbd: "⇧T" },
      ],
    },
    {
      label: "Security",
      items: [
        { label: "IAM & roles",             icon: "users",  route: "iam" },
        { label: "Env & secrets",           icon: "key",    route: "secrets" },
        { label: "Audit trail",             icon: "scroll", route: "audit" },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Costs & budget",          icon: "coin",   route: "costs" },
        { label: "Infrastructure",          icon: "server", route: "infrastructure" },
        { label: "Links",                   icon: "branch", route: "links" },
      ],
    },
    {
      label: "Team",
      items: [
        { label: "Invite team member", icon: "plus",  shortcut: "⇧I" },
        { label: "Manage members",     icon: "users", route: "iam" },
      ],
    },
  ];

  return (
    <div className="sidebar-foot" ref={wrapRef}>
      <button
        className={`user-btn ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="av">{SESSION.user.initials}</div>
        <div className="user-meta">
          <div className="user-name">{SESSION.user.displayName}</div>
          <div className="user-role">{SESSION.user.role} · <span className="mono">{now}</span></div>
        </div>
        <span className={`chev ${open ? "open" : ""}`}><Icon name="chevron" /></span>
      </button>

      {open && (
        <div className="user-menu" role="menu">
          <div className="user-menu-head">
            <div className="av lg">{SESSION.user.initials}</div>
            <div>
              <div className="user-name">{SESSION.user.displayName}</div>
              <div className="user-role">{SESSION.user.role} · <span className="mono">{SESSION.user.tenant}</span></div>
              <div className="user-email mono">{SESSION.user.email}</div>
            </div>
          </div>

          {sections.map((sec, si) => (
            <div key={sec.label} className="user-menu-section">
              <div className="user-menu-label">{sec.label}</div>
              {sec.items.map((it) => (
                <button
                  key={it.label}
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => {
                    if (it.route) onNav(it.route);
                    setOpen(false);
                  }}
                >
                  <span className="user-menu-ic"><Icon name={it.icon} /></span>
                  <span>{it.label}</span>
                  {(it.kbd || it.shortcut) && <span className="user-menu-kbd mono">{it.kbd || it.shortcut}</span>}
                </button>
              ))}
            </div>
          ))}

          <div className="user-menu-section">
            <button className="user-menu-item danger" role="menuitem" onClick={() => { setOpen(false); onSignOut && onSignOut(); }}>
              <span className="user-menu-ic"><Icon name="lock" /></span>
              <span>Sign out</span>
              <span className="user-menu-kbd mono">⇧Q</span>
            </button>
          </div>

          <div className="user-menu-foot mono">
            session · sealed · expires in 6h 23m
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const initial = () => {
    const h = (window.location.hash || "#overview").slice(1);
    return PAGES[h] ? h : "overview";
  };
  const [route, setRoute] = useState(initial);
  const [authed, setAuthed] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || "#overview").slice(1);
      if (PAGES[h]) setRoute(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const nav = (id) => {
    window.location.hash = id;
    setRoute(id);
    const m = document.querySelector(".main");
    if (m) m.scrollTop = 0;
  };

  const signOut = () => setAuthed(false);

  if (!authed) {
    return (
      <>
        <MatrixRain />
        <LoginPage onLogin={() => setAuthed(true)} />
      </>
    );
  }

  const PageC = (PAGES[route] || PAGES.overview).c;

  return (
    <>
      <MatrixRain />
      <div className="shell">
        <Topbar route={route} onShowSession={() => setShowSessionModal(true)} />
        <Sidebar route={route} onNav={nav} onSignOut={signOut} />
        <div className="main">
          <PageC />
        </div>
      </div>
      {showSessionModal && <SessionExpiredModal onClose={() => setShowSessionModal(false)} onLogin={() => { setShowSessionModal(false); }} />}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// ============================================================
// LOGIN PAGE  (visible on "sign out")
// ============================================================
function LoginPage({ onLogin }) {
  const [tenant, setTenant] = useState("agent-matrix");
  const [user, setUser] = useState("trinity.morgan");
  const [pw, setPw] = useState("");
  const [pending, setPending] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    setPending(true);
    // simulated round-trip
    setTimeout(() => { setPending(false); onLogin(); }, 700);
  };
  return (
    <div className="login-shell">
      <div className="login-bg" />
      <div className="login-frame">
        <div className="login-head">
          <div className="row" style={{ gap: 10 }}>
            <BrandLogo />
            <div>
              <div className="login-brand">MATRIX <span style={{ color: "var(--grn-1)" }}>CLOUD</span></div>
              <div className="login-brand-sub">agent-matrix · admin console</div>
            </div>
          </div>
          <div className="env-pill"><span className="dot" /> PROD · ZION</div>
        </div>

        <form className="login-card" onSubmit={submit}>
          <div className="login-title">Secure admin access</div>
          <div className="login-sub mono">session is sealed via HTTP-only cookie</div>

          <label className="login-label">Tenant</label>
          <div className="login-select">
            <input className="input" value={tenant} onChange={(e) => setTenant(e.target.value)} />
            <Icon name="chevron" color="var(--fg-3)" />
          </div>

          <label className="login-label">Email / username</label>
          <input className="input" value={user} onChange={(e) => setUser(e.target.value)} />

          <label className="login-label">Password</label>
          <input className="input" type="password" placeholder="••••••••••••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />

          <label className="login-check">
            <input type="checkbox" defaultChecked /> Remember this device
          </label>

          <button className="btn primary login-cta" type="submit" disabled={pending}>
            {pending ? <><span className="spin"><Icon name="refresh" /></span> Authenticating…</> : <>Continue to Mission Control <Icon name="chevron" /></>}
          </button>

          <div className="login-sso">
            <span className="login-sep"><span /> or <span /></span>
            <div className="row" style={{ gap: 8, justifyContent: "center" }}>
              <button type="button" className="btn" disabled><Icon name="branch" /> GitHub</button>
              <button type="button" className="btn" disabled><Icon name="branch" /> Google</button>
              <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10 }}>SSO coming soon</span>
            </div>
          </div>
        </form>

        <div className="login-foot mono">
          Protected console for MatrixHub · SelfRepair · Agent-Generator · HomePilot · OllaBridge
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SESSION-EXPIRED MODAL
// ============================================================
function SessionExpiredModal({ onClose, onLogin }) {
  const [pw, setPw] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault();
    setPending(true);
    setTimeout(() => { setPending(false); onLogin(); }, 700);
  };
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal session-modal" onSubmit={submit}>
        <div className="modal-head">
          <div className="row" style={{ gap: 10 }}>
            <div className="modal-mark"><Icon name="lock" color="var(--amber-1)" /></div>
            <div>
              <div className="modal-title">Session required</div>
              <div className="modal-sub mono">your matrix cloud session has expired</div>
            </div>
          </div>
          <button type="button" className="btn icon ghost" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <label className="login-label">Username</label>
          <input className="input" defaultValue={SESSION.user.displayName} readOnly />
          <label className="login-label">Password</label>
          <input className="input" type="password" autoFocus placeholder="••••••••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="row" style={{ marginTop: 14, gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? <><span className="spin"><Icon name="refresh" /></span> Authenticating…</> : <>Continue</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// expose for hot use
window.MATRIX_AUTH = { LoginPage, SessionExpiredModal };
