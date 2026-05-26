/* global React, window */
// ============================================================
// Matrix Cloud Admin — page components (Agent-Matrix ecosystem)
// ============================================================
const { useState: usePgState, useMemo: usePgMemo, useEffect: usePgEffect } = React;
const { Icon, Pill, Switch, Card, Spark, StatCard, Bar, statusToPill } = window.MATRIX_UI;
const {
  KPIS, SERVICES, CATALOG, ALIVE, SELFREPAIR, GENERATOR, HOMEPILOT, OLLABRIDGE,
  DATABASE, ENV_SECRETS, COSTS, EVENTS, PEOPLE, POLICIES, LINKS, SESSION,
} = window.MATRIX_DATA;

// ---------- Page chrome ----------
function PageHead({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        <div className="page-sub">{sub}</div>
      </div>
      <div className="page-actions">{actions}</div>
    </div>
  );
}
function ExtLink({ href, children }) {
  return (
    <a className="ext-link" href={href} target="_blank" rel="noopener">
      <Icon name="branch" /> {children}
    </a>
  );
}
function statusKind(s) {
  if (s === "ok") return "ok";
  if (s === "warn") return "warn";
  if (s === "err") return "err";
  return "muted";
}
function statusLabel(s) {
  if (s === "ok") return "HEALTHY";
  if (s === "warn") return "WARNING";
  if (s === "err") return "FAILING";
  return "UNKNOWN";
}

// ============================================================
// MISSION CONTROL — cockpit (Simple) / control-room (Advanced)
// ============================================================
function PageOverview() {
  const [mode, setMode] = usePgState(() => localStorage.getItem("mc-mode") || "simple");
  usePgEffect(() => { localStorage.setItem("mc-mode", mode); }, [mode]);

  const healthy = SERVICES.filter(s => s.status === "ok").length;
  const warn    = SERVICES.filter(s => s.status === "warn").length;
  const fail    = SERVICES.filter(s => s.status === "err").length;
  const systemAlive = fail === 0;

  // current loop step = first non-ok, else last ok
  const currentLoop =
    ALIVE.find(a => a.status !== "ok") || ALIVE[ALIVE.length - 1];

  // synthesize action list from real data
  const actions = [];
  SELFREPAIR.issues
    .filter(i => i.severity !== "ok")
    .slice(0, 2)
    .forEach((i) => actions.push({
      kind: i.severity,
      title: `SelfRepair ${i.severity === "err" ? "failure" : "warning"} · ${i.agent}`,
      detail: i.title + (i.pr ? ` · PR ${i.pr}` : ""),
      cta: [
        { label: "Open issue", href: SELFREPAIR.actions },
        { label: "Open SelfRepair", route: "selfrepair" },
      ],
    }));
  const pending = GENERATOR.recent.filter(r => r.status === "pending-pr");
  if (pending.length) actions.push({
    kind: "info",
    title: `Publish queue · ${pending.length} PR${pending.length>1?"s":""} waiting`,
    detail: pending.map(p => p.name).join(" · "),
    cta: [{ label: "Review PRs", route: "generator" }],
  });
  const observe = ALIVE.find(a => a.key === "observe");
  if (observe && observe.status !== "ok") actions.push({
    kind: "warn",
    title: "Observe delayed",
    detail: `${observe.detail} · last ${observe.last}`,
    cta: [{ label: "Run observe", route: "alive" }],
  });

  return (
    <div className="page">
      <PageHead
        title="Mission Control"
        sub={`AGENT-MATRIX · ${SESSION.user.tenant} · ${SESSION.environment.stage}`}
        actions={(
          <>
            <ModeSwitch mode={mode} setMode={setMode} />
            <button className="btn ghost"><Icon name="refresh" /> Sync</button>
            <button className="btn primary"><Icon name="play" /> Run alive cycle</button>
          </>
        )}
      />

      {/* (1) STATUS STRIP — always */}
      <StatusStrip
        alive={systemAlive}
        healthy={healthy} warn={warn} fail={fail}
        total={SERVICES.length}
        catalog={CATALOG.length}
      />

      {/* (2) NEEDS ATTENTION + (3) ALIVE LOOP */}
      <div className="split-2" style={{ marginTop: 16, marginBottom: 16 }}>
        <NeedsAttention actions={actions} />
        <CurrentLoop current={currentLoop} />
      </div>

      {/* (4) SERVICES TABLE — always */}
      <ServicesTable />

      {/* ADVANCED-ONLY content */}
      {mode === "advanced" && (
        <>
          <div className="grid grid-6" style={{ marginTop: 18 }}>
            {KPIS.map((k) => <StatCard key={k.label} {...k} />)}
          </div>

          <div className="split-2" style={{ marginTop: 16 }}>
            <Card
              title="Activity"
              sub={`${EVENTS.length} events · last 30 min`}
              action={<button className="btn sm ghost" onClick={() => (window.location.hash = "logs")}>open logs</button>}
            >
              <div className="col" style={{ gap: 0 }}>
                {EVENTS.map((e, i) => (
                  <div key={i} className="event">
                    <div className={`dot ${e.kind === "ok" ? "" : e.kind}`} />
                    <div className="time">{e.t}</div>
                    <div className="msg">{e.msg}</div>
                    <div className="src">{e.src}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Quick console" sub="GET /admin/status" action={<Pill kind="ok" dot={false}>200 OK</Pill>}>
              <pre className="code" style={{ marginBottom: 10 }}>
{`> GET `}<span className="g">/admin/status</span>{`
{
  "api":        { "status": "ok", "version": "0.1.0" },
  "database":   { "status": "ok", "provider": "aiven" },
  "catalog":    { "items": `}<span className="p">12</span>{`, "last_sync": "08:42 UTC" },
  "health":     { "healthy": `}<span className="p">9</span>{`, "warnings": `}<span className="p">2</span>{`, "failing": `}<span className="p">1</span>{` },
  "selfrepair": { "last_scan": "03:00 UTC", "open_issues": `}<span className="p">3</span>{` },
  "generator":  { "pending_pr": `}<span className="p">2</span>{`, "templates": `}<span className="p">6</span>{` },
  "inference":  { "default_route": "local", "hf_pro": false },
  "cost":       { "monthly_estimate_eur": `}<span className="p">0</span>{` }
}
`}<span className="c">// next sync in 7m</span>
              </pre>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                {["sync catalog","run selfrepair","validate manifests","open vercel","open aiven","open github"].map(c => (
                  <button key={c} className="btn sm"><Icon name="terminal" />{c}</button>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Simple/Advanced toggle ----------
function ModeSwitch({ mode, setMode }) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Mode">
      {[
        ["simple",   "Simple"],
        ["advanced", "Advanced"],
      ].map(([k, lbl]) => (
        <button
          key={k}
          className={`mode-btn ${mode === k ? "on" : ""}`}
          onClick={() => setMode(k)}
          role="tab" aria-selected={mode === k}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

// ---------- (1) Compact status strip ----------
function StatusStrip({ alive, healthy, warn, fail, total, catalog }) {
  return (
    <div className={`status-strip ${alive ? "ok" : "warn"}`}>
      <div className="status-main">
        <div className={`status-light ${alive ? "ok" : "err"}`}>
          <span className="ring" />
          <span className="dot" />
        </div>
        <div>
          <div className="status-headline">
            {alive ? "MatrixHub is alive" : "MatrixHub needs attention"}
          </div>
          <div className="status-meta mono">
            last cycle 08:44 UTC · next SelfRepair 03:00 UTC · HF Pro OFF
          </div>
        </div>
      </div>
      <div className="status-stats">
        <Stat label="cost"     value="€0"       hint="/month" tone="ok" />
        <Stat label="inference"value="LOCAL"     hint=""       tone="ok" />
        <Stat label="catalog"  value={catalog}   hint="agents" tone="ok" />
        <Stat label="healthy"  value={`${healthy}/${total}`} hint="services" tone="ok" />
        <Stat label="warn"     value={warn}      hint=""       tone={warn ? "warn" : "muted"} />
        <Stat label="failed"   value={fail}      hint=""       tone={fail ? "err"  : "muted"} />
      </div>
    </div>
  );
}
function Stat({ label, value, hint, tone }) {
  return (
    <div className={`stat-cell ${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}{hint && <span className="stat-hint"> {hint}</span>}
      </div>
    </div>
  );
}

// ---------- (2) Needs attention ----------
function NeedsAttention({ actions }) {
  return (
    <Card
      title="Needs attention"
      sub={actions.length ? `${actions.length} item${actions.length>1?"s":""} require action` : "all clear"}
    >
      {actions.length === 0 ? (
        <div className="empty-clear">
          <div className="empty-mark"><Icon name="check" size={20} /></div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>No action needed.</div>
            <div className="page-sub" style={{ fontSize: 11 }}>MatrixHub is alive and healthy.</div>
          </div>
        </div>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {actions.map((a, i) => (
            <div key={i} className={`attention ${a.kind}`}>
              <div className={`attention-num ${a.kind}`}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="attention-title">{a.title}</div>
                <div className="attention-detail">{a.detail}</div>
                <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {a.cta.map((c, j) => (
                    c.href
                      ? <a key={j} className="btn sm" href={c.href} target="_blank" rel="noopener">{c.label}</a>
                      : <button key={j} className="btn sm" onClick={() => c.route && (window.location.hash = c.route)}>{c.label}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- (3) Current loop ----------
function CurrentLoop({ current }) {
  const [expanded, setExpanded] = usePgState(false);
  const idx = ALIVE.findIndex(a => a.key === current.key);
  return (
    <Card
      title="Alive loop"
      sub={`step ${current.step}/${ALIVE.length}`}
      action={
        <button className="btn sm ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "View full loop"}
        </button>
      }
    >
      <div className="loop-current">
        <div className={`alive-step lg ${current.status}`}>{String(current.step).padStart(2,"0")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="loop-step-label mono">CURRENT STEP</div>
          <div className="loop-step-title">{current.title}</div>
          <div className="loop-step-sub">{current.sub}</div>
        </div>
        <Pill kind={statusKind(current.status)}>{statusLabel(current.status)}</Pill>
      </div>

      <div className="loop-meta">
        <div className="kv"><span className="k">last</span><span className="v">{current.last}</span></div>
        <div className="kv"><span className="k">detail</span><span className="v">{current.detail}</span></div>
      </div>

      <div className="loop-track">
        {ALIVE.map((a, i) => {
          const done = i < idx;
          const here = i === idx;
          return (
            <div key={a.key} className={`loop-dot ${done ? "done" : here ? "here" : "todo"} ${a.status}`} title={a.title}>
              {done ? "✓" : here ? "●" : "○"}
              <span className="loop-dot-label">{a.title}</span>
            </div>
          );
        })}
      </div>

      {expanded && (
        <div className="loop-expanded">
          {ALIVE.map((a) => (
            <div key={a.key} className="loop-row">
              <div className={`alive-step ${a.status}`}>{String(a.step).padStart(2,"0")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.title}</div>
                <div className="page-sub" style={{ fontSize: 11 }}>{a.sub}</div>
              </div>
              <Pill kind={statusKind(a.status)}>{a.last || "—"}</Pill>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- (4) Services table ----------
function ServicesTable() {
  return (
    <Card
      title="Services"
      sub={`${SERVICES.length} services · click a row to inspect`}
      action={<button className="btn sm ghost" onClick={() => (window.location.hash = "infrastructure")}>open infrastructure</button>}
    >
      <table className="tbl svc-table">
        <thead><tr><th>Service</th><th>Role</th><th>Provider</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {SERVICES.map((s) => (
            <tr key={s.id}>
              <td><div style={{ fontWeight: 500 }}>{s.name}</div></td>
              <td className="dim">{s.category}</td>
              <td className="mono dim">{s.provider}</td>
              <td><Pill kind={statusKind(s.status)}>{statusLabel(s.status)}</Pill></td>
              <td><div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                <a className="btn sm ghost" href={s.admin} target="_blank" rel="noopener">Open</a>
                <button className="btn sm ghost"><Icon name="pulse" /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------- Service tile (used in Mission Control + Infrastructure) ----------
function ServiceTile({ svc, compact }) {
  return (
    <div className="card svc-card">
      <div className="card-body">
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <ProviderMark provider={svc.provider} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <div className="svc-name">{svc.name}</div>
              <Pill kind={statusKind(svc.status)}>{statusLabel(svc.status)}</Pill>
            </div>
            <div className="svc-meta mono">{svc.provider} · {svc.category}</div>
            {!compact && <div className="svc-notes">{svc.notes}</div>}
          </div>
        </div>
      </div>
      <div className="card-foot">
        <a className="btn sm ghost" href={svc.admin} target="_blank" rel="noopener"><Icon name="branch" /> Open</a>
        <button className="btn sm ghost"><Icon name="pulse" /> Test</button>
        {!compact && <button className="btn sm ghost"><Icon name="refresh" /> Sync</button>}
        <div className="grow" />
        <button className="btn sm ghost"><Icon name="dots" /></button>
      </div>
    </div>
  );
}
function ProviderMark({ provider }) {
  const map = {
    "Vercel": { letter: "▲", color: "#fff" },
    "OCI Always-Free": { letter: "OCI", color: "#f80000" },
    "Aiven": { letter: "Aiv", color: "#ff0066" },
    "GitHub": { letter: "GH", color: "#fff" },
    "GitHub Actions": { letter: "GA", color: "#fff" },
    "Hugging Face": { letter: "🤗", color: "#ffd21e" },
    "Cloudflare": { letter: "CF", color: "#f48120" },
    "Local app": { letter: "HP", color: "var(--grn-1)" },
    "Local / HF": { letter: "OB", color: "var(--grn-1)" },
  };
  const m = map[provider] || { letter: provider.slice(0,2).toUpperCase(), color: "var(--grn-1)" };
  return (
    <div className="provider-mark" style={{ color: m.color }}>
      <span>{m.letter}</span>
    </div>
  );
}

// ============================================================
// ALIVE LOOP
// ============================================================
function PageAliveLoop() {
  return (
    <div className="page">
      <PageHead
        title="Alive Loop"
        sub="THE LIVING SYSTEM // safety before autonomy · human-gated · reuse before generation"
        actions={(
          <>
            <button className="btn ghost"><Icon name="refresh" /> Re-run cycle (dry)</button>
            <button className="btn primary"><Icon name="play" /> Trigger discover</button>
          </>
        )}
      />

      {/* Visual loop diagram */}
      <Card title="Cycle topology" sub="discover → validate → install → run → observe → repair → republish → learn">
        <AliveLoopDiagram />
      </Card>

      <div className="grid grid-4" style={{ marginTop: 16 }}>
        {ALIVE.map((a) => (
          <div key={a.key} className="card alive-card">
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <div className={`alive-step lg ${a.status}`}>{String(a.step).padStart(2,"0")}</div>
                <Pill kind={statusKind(a.status)}>{statusLabel(a.status)}</Pill>
              </div>
              <div className="alive-title" style={{ fontSize: 14 }}>{a.title}</div>
              <div className="alive-sub" style={{ marginTop: 2 }}>{a.sub}</div>
              <div className="divider" />
              <div className="kv"><span className="k">last</span><span className="v">{a.last}</span></div>
              <div className="kv"><span className="k">detail</span><span className="v">{a.detail}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AliveLoopDiagram() {
  // 8 nodes arranged in a ring
  const cx = 420, cy = 170, r = 130;
  const items = ALIVE.map((a, i) => {
    const ang = (i / ALIVE.length) * Math.PI * 2 - Math.PI / 2;
    return { ...a, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
  });
  const colorFor = (s) =>
    s === "err" ? "var(--red-1)" : s === "warn" ? "var(--amber-1)" : "var(--grn-1)";
  return (
    <svg viewBox="0 0 840 340" width="100%" height={340}>
      <defs>
        <marker id="al-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--grn-3)" />
        </marker>
      </defs>
      {/* center label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fontFamily="Geist" fill="var(--fg-0)">AGENT-MATRIX</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--fg-3)" letterSpacing="0.2em">ALIVE LOOP</text>
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="var(--line-1)" strokeDasharray="3 5" />
      {/* edges between consecutive items */}
      {items.map((it, i) => {
        const nx = items[(i + 1) % items.length];
        return (
          <line key={i} x1={it.x} y1={it.y} x2={nx.x} y2={nx.y}
                stroke="var(--grn-3)" strokeWidth="1" opacity="0.7" markerEnd="url(#al-arrow)" />
        );
      })}
      {items.map((it) => (
        <g key={it.key} transform={`translate(${it.x},${it.y})`}>
          <rect x="-58" y="-22" width="116" height="44" rx="8"
                fill="var(--bg-3)" stroke={colorFor(it.status)} strokeWidth="1.2" />
          <text y="-4" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="var(--fg-3)" letterSpacing="0.14em">
            {String(it.step).padStart(2,"0")}
          </text>
          <text y="12" textAnchor="middle" fontFamily="Geist" fontSize="12" fill="var(--fg-0)">{it.title}</text>
          <circle cx="48" cy="-12" r="3" fill={colorFor(it.status)}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// CATALOG
// ============================================================
function PageCatalog() {
  const [filter, setFilter] = usePgState("all");
  const filtered = filter === "all" ? CATALOG : CATALOG.filter(c => c.type === filter);
  const counts = {
    all: CATALOG.length,
    agent: CATALOG.filter(c => c.type === "agent").length,
    persona: CATALOG.filter(c => c.type === "persona").length,
    tool: CATALOG.filter(c => c.type === "tool").length,
    mcp_server: CATALOG.filter(c => c.type === "mcp_server").length,
  };
  return (
    <div className="page">
      <PageHead
        title="Catalog"
        sub={`${CATALOG.length} MANIFESTS · SOURCE OF TRUTH = github.com/agent-matrix/catalog`}
        actions={(
          <>
            <button className="btn ghost"><Icon name="check" /> Validate manifests</button>
            <button className="btn"><Icon name="download" /> Export catalog.json</button>
            <button className="btn primary"><Icon name="refresh" /> Sync catalog</button>
          </>
        )}
      />

      <div className="tabs">
        {[
          ["all","All"], ["agent","Agents"], ["persona","Personas"], ["tool","Tools"], ["mcp_server","MCP servers"],
        ].map(([k, lbl]) => (
          <div key={k} className={`t ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
            {lbl} <span className="mono" style={{ color: "var(--fg-3)", marginLeft: 4 }}>{counts[k]}</span>
          </div>
        ))}
      </div>

      <Card>
        <table className="tbl">
          <thead><tr>
            <th>Name</th><th>Type</th><th>Repo</th><th>Version</th><th>Route</th>
            <th>Installs</th><th>Validated</th><th>Health</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.name}>
                <td><div style={{ fontWeight: 500 }}>{c.name}</div>
                  <div className="page-sub" style={{ fontSize: 11 }}>{c.compat.join(", ")}</div></td>
                <td><Pill kind="info" dot={false}>{c.type.toUpperCase()}</Pill></td>
                <td className="mono dim">{c.repo}</td>
                <td className="mono">v{c.version}</td>
                <td className="mono dim">{c.route}</td>
                <td className="mono">{c.installs.toLocaleString()}</td>
                <td className="mono dim">{c.validated}</td>
                <td><Pill kind={statusKind(c.health)}>{statusLabel(c.health)}</Pill></td>
                <td><div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn icon sm" title="Open repo"><Icon name="branch" /></button>
                  <button className="btn icon sm"><Icon name="dots" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// AGENTS (subset of catalog)
// ============================================================
function PageAgents() {
  const agents = CATALOG.filter(c => c.type === "agent");
  return (
    <div className="page">
      <PageHead
        title="Agents"
        sub={`${agents.length} AGENTS IN CATALOG · LOCAL-FIRST · HOMEPILOT-COMPATIBLE`}
        actions={<button className="btn primary"><Icon name="plus" /> Register agent</button>}
      />
      <Card>
        <table className="tbl">
          <thead><tr>
            <th>Agent</th><th>Repo</th><th>Version</th><th>Route</th><th>HomePilot</th>
            <th>Installs</th><th>Validated</th><th>Health</th><th></th>
          </tr></thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.name}>
                <td><div style={{ fontWeight: 500 }}>{a.name}</div></td>
                <td className="mono dim">{a.repo}</td>
                <td className="mono">v{a.version}</td>
                <td className="mono dim">{a.route}</td>
                <td>{a.compat[0].startsWith("homepilot") ? <Pill kind="ok">COMPATIBLE</Pill> : <Pill kind="muted">—</Pill>}</td>
                <td className="mono">{a.installs.toLocaleString()}</td>
                <td className="mono dim">{a.validated}</td>
                <td><Pill kind={statusKind(a.health)}>{statusLabel(a.health)}</Pill></td>
                <td><div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn icon sm"><Icon name="branch" /></button>
                  <button className="btn icon sm"><Icon name="dots" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// AGENT-GENERATOR
// ============================================================
function PageGenerator() {
  return (
    <div className="page">
      <PageHead
        title="Agent-Generator"
        sub="HUMAN-GATED · NO AUTO-RUNS · creates agents, opens publish PRs"
        actions={(
          <>
            <ExtLink href="https://github.com/agent-matrix/agent-generator">Open repo</ExtLink>
            <button className="btn"><Icon name="branch" /> Open publish PRs</button>
            <button className="btn primary"><Icon name="plus" /> Generate from template</button>
          </>
        )}
      />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <StatCard label="PENDING PRs"   value={GENERATOR.recent.filter(r => r.status === "pending-pr").length} delta="awaiting review" trend="zero" spark={[0,1,1,1,2,2,2,2,2,2,2,2]} />
        <StatCard label="MERGED (30d)"  value={GENERATOR.recent.filter(r => r.status === "merged").length}     delta="—"               trend="zero" spark={[0,0,0,1,1,1,1,1,1,1,1,1]} />
        <StatCard label="FAILED RUNS"   value={GENERATOR.recent.filter(r => r.status === "failed").length}    delta="last 7d"         trend="dn"   spark={[0,0,0,0,1,1,1,1,1,1,1,1]} />
      </div>

      <div className="split-2" style={{ marginBottom: 16 }}>
        <Card title="Recent generations">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Template</th><th>Author</th><th>PR</th><th>Opened</th><th>Status</th></tr></thead>
            <tbody>
              {GENERATOR.recent.map((r) => (
                <tr key={r.id}>
                  <td><div style={{ fontWeight: 500 }}>{r.name}</div>
                    {r.err && <div className="page-sub" style={{ fontSize: 11, color: "var(--red-1)" }}>{r.err}</div>}</td>
                  <td className="mono dim">{r.template}</td>
                  <td>{r.author}</td>
                  <td className="mono">{r.pr}</td>
                  <td className="mono dim">{r.opened}</td>
                  <td>
                    {r.status === "merged"      && <Pill kind="ok">MERGED</Pill>}
                    {r.status === "pending-pr"  && <Pill kind="info">PENDING REVIEW</Pill>}
                    {r.status === "failed"      && <Pill kind="err">FAILED</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Templates" sub="reuse before generation">
          <div className="col" style={{ gap: 6 }}>
            {GENERATOR.templates.map((t) => (
              <div key={t} className="row" style={{
                justifyContent: "space-between",
                padding: "8px 12px", border: "1px solid var(--line-1)", borderRadius: 6, background: "var(--bg-3)"
              }}>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="cube" color="var(--grn-1)" />
                  <span className="mono">{t}</span>
                </div>
                <button className="btn sm">Generate</button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Cost guard" sub="generator runs cost compute · gated by policy">
        <div className="row" style={{ gap: 16 }}>
          <Pill kind="ok">policy: generator-human-gated ENFORCED</Pill>
          <Pill kind="muted">runs require approval from OWNER or ADMIN</Pill>
          <div className="grow" />
          <button className="btn sm ghost"><Icon name="shield" /> Open policy</button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SELFREPAIR
// ============================================================
function PageSelfRepair() {
  return (
    <div className="page">
      <PageHead
        title="SelfRepair"
        sub="HEALTH AUTOMATION · scans catalog, opens issues + PRs"
        actions={(
          <>
            <ExtLink href={SELFREPAIR.actions}>GitHub Actions</ExtLink>
            <button className="btn primary"><Icon name="play" /> Run scan now</button>
          </>
        )}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="HEALTHY"   value={SELFREPAIR.healthy}   delta="catalog items"   trend="up"   spark={[7,7,8,8,8,8,9,9,9,9,9,9]} />
        <StatCard label="WARNINGS"  value={SELFREPAIR.warnings}  delta="needs attention" trend="dn"   spark={[0,0,1,1,1,1,2,2,2,2,2,2]} />
        <StatCard label="FAILURES"  value={SELFREPAIR.failures}  delta="blocking"        trend="dn"   spark={[0,0,0,0,0,0,0,1,1,1,1,1]} />
        <StatCard label="OPEN PRs"  value={SELFREPAIR.issues.filter(i => i.pr).length} delta="auto-opened" trend="zero" spark={[0,0,1,1,1,1,2,2,2,2,2,2]} />
      </div>

      <div className="split-2" style={{ marginBottom: 16 }}>
        <Card title="Scan window" sub="daily at 03:00 UTC">
          <div className="kv"><span className="k">last scan</span><span className="v">{SELFREPAIR.lastScan}</span></div>
          <div className="kv"><span className="k">next scan</span><span className="v">{SELFREPAIR.nextScan}</span></div>
          <div className="kv"><span className="k">strategy</span><span className="v">validate · diff · open-issue · open-pr</span></div>
          <div className="kv"><span className="k">policy</span><span className="v">selfrepair-pr-required (enforced)</span></div>
        </Card>
        <Card title="Repair philosophy">
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--fg-1)", lineHeight: 1.7 }}>
            <li>Detect &gt; act. Issues precede PRs.</li>
            <li>Every PR is human-reviewed before merge.</li>
            <li>SelfRepair never modifies prod runtime directly.</li>
            <li>Failed runs roll back automatically; no silent fixes.</li>
          </ul>
        </Card>
      </div>

      <Card title="Open issues" sub={`${SELFREPAIR.issues.length} active`}>
        <table className="tbl">
          <thead><tr><th>ID</th><th>Agent</th><th>Severity</th><th>Title</th><th>Opened</th><th>PR</th><th></th></tr></thead>
          <tbody>
            {SELFREPAIR.issues.map((i) => (
              <tr key={i.id}>
                <td className="mono">{i.id}</td>
                <td><div style={{ fontWeight: 500 }}>{i.agent}</div></td>
                <td><Pill kind={statusKind(i.severity)}>{i.severity.toUpperCase()}</Pill></td>
                <td>{i.title}</td>
                <td className="mono dim">{i.opened}</td>
                <td className="mono">{i.pr || "—"}</td>
                <td><div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn sm ghost">View</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// HOMEPILOT
// ============================================================
function PageHomePilot() {
  const total = HOMEPILOT.recentInstalls.reduce((a, b) => a + b.count, 0);
  return (
    <div className="page">
      <PageHead
        title="HomePilot"
        sub="LOCAL-FIRST USER RUNTIME · users run on their own machine · we pay no inference"
        actions={(
          <>
            <ExtLink href="https://github.com/agent-matrix/homepilot">Repo</ExtLink>
            <a className="btn primary" href={HOMEPILOT.download} target="_blank" rel="noopener"><Icon name="download" /> Download v{HOMEPILOT.version}</a>
          </>
        )}
      />

      <div className="split-2" style={{ marginBottom: 16 }}>
        <Card title="Release" sub={`v${HOMEPILOT.version}`}>
          <div className="kv"><span className="k">version</span><span className="v">{HOMEPILOT.version}</span></div>
          <div className="kv"><span className="k">released</span><span className="v">{HOMEPILOT.release}</span></div>
          <div className="kv"><span className="k">mode</span><span className="v">{HOMEPILOT.mode}</span></div>
          <div className="kv"><span className="k">compatible personas</span><span className="v">{HOMEPILOT.compatPersonas.length}</span></div>
          <div className="divider" />
          <div className="row" style={{ gap: 8 }}>
            <button className="btn sm"><Icon name="copy" /> Install command</button>
            <a className="btn sm" href={HOMEPILOT.download} target="_blank" rel="noopener"><Icon name="download" /> Direct download</a>
          </div>
        </Card>
        <Card title="Compatible personas">
          <div className="col" style={{ gap: 6 }}>
            {HOMEPILOT.compatPersonas.map((p) => (
              <div key={p} className="row" style={{
                justifyContent: "space-between",
                padding: "8px 12px", border: "1px solid var(--line-1)", borderRadius: 6, background: "var(--bg-3)"
              }}>
                <span className="mono">{p}</span>
                <Pill kind="ok">LOADS</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Recent installs by OS" sub={`${total.toLocaleString()} total (last 30 days)`}>
        <table className="tbl">
          <thead><tr><th>OS</th><th>Installs</th><th>Share</th></tr></thead>
          <tbody>
            {HOMEPILOT.recentInstalls.map((r) => {
              const pct = Math.round((r.count / total) * 100);
              return (
                <tr key={r.os}>
                  <td>{r.os}</td>
                  <td className="mono">{r.count.toLocaleString()}</td>
                  <td style={{ width: 280 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <Bar pct={pct} />
                      <span className="mono dim" style={{ width: 32 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// OLLABRIDGE
// ============================================================
function PageOllaBridge() {
  return (
    <div className="page">
      <PageHead
        title="OllaBridge"
        sub={`INFERENCE ROUTING · policy: ${OLLABRIDGE.policy}`}
        actions={(
          <>
            <ExtLink href="https://github.com/agent-matrix/ollabridge">Repo</ExtLink>
            <button className="btn"><Icon name="shield" /> Open route policy</button>
          </>
        )}
      />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <StatCard label="REQUESTS TODAY" value={OLLABRIDGE.todayRequests.toLocaleString()} delta="local-first" trend="up"   spark={[5,6,6,7,7,8,8,9,10,10,11,12]} />
        <StatCard label="PLATFORM SPEND" value={OLLABRIDGE.budget} delta="HF Pro: OFF"     trend="zero" spark={[0,0,0,0,0,0,0,0,0,0,0,0]} />
        <StatCard label="ROUTES ACTIVE"  value={OLLABRIDGE.routes.filter(r => r.enabled).length} unit={`/${OLLABRIDGE.routes.length}`} delta="—" trend="zero" spark={[3,3,3,3,3,3,3,3,3,3,3,3]} />
      </div>

      <Card title="Route policy" sub="cheapest route first · expensive routes human-gated">
        <table className="tbl">
          <thead><tr><th>Route</th><th>Status</th><th>Today share</th><th>Platform cost</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {OLLABRIDGE.routes.map((r) => (
              <tr key={r.name}>
                <td><div style={{ fontWeight: 500 }}>{r.name}</div></td>
                <td>{r.enabled ? <Pill kind="ok">ENABLED</Pill> : <Pill kind="muted">OFF</Pill>}</td>
                <td style={{ width: 240 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Bar pct={r.share} />
                    <span className="mono dim" style={{ width: 32 }}>{r.share}%</span>
                  </div>
                </td>
                <td className="mono">{r.cost}</td>
                <td className="dim">{r.note}</td>
                <td><Switch on={r.enabled} onChange={() => {}} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// INFRASTRUCTURE
// ============================================================
function PageInfra() {
  return (
    <div className="page">
      <PageHead
        title="Infrastructure"
        sub={`${SERVICES.length} services · provider-managed · low-budget by design`}
        actions={(
          <>
            <button className="btn ghost"><Icon name="refresh" /> Reconcile</button>
            <button className="btn primary"><Icon name="plus" /> Add service</button>
          </>
        )}
      />
      <div className="grid grid-3">
        {SERVICES.map((s) => <ServiceTile key={s.id} svc={s} />)}
      </div>
    </div>
  );
}

// ============================================================
// DATABASE (Aiven)
// ============================================================
function PageDatabase() {
  const usedPct = Math.round((DATABASE.storage.used / DATABASE.storage.total) * 100);
  return (
    <div className="page">
      <PageHead
        title="Database"
        sub={`${DATABASE.engine} · provider ${DATABASE.provider} · ssl=${DATABASE.sslMode}`}
        actions={(
          <>
            <ExtLink href="https://console.aiven.io">Aiven console</ExtLink>
            <button className="btn"><Icon name="pulse" /> Test connection</button>
          </>
        )}
      />

      <div className="split-2" style={{ marginBottom: 16 }}>
        <Card title="Connection" sub="never displays password">
          <div className="kv"><span className="k">provider</span><span className="v">{DATABASE.provider}</span></div>
          <div className="kv"><span className="k">engine</span><span className="v">{DATABASE.engine}</span></div>
          <div className="kv"><span className="k">host</span><span className="v">{DATABASE.host}</span></div>
          <div className="kv"><span className="k">port</span><span className="v">{DATABASE.port}</span></div>
          <div className="kv"><span className="k">database</span><span className="v">{DATABASE.database}</span></div>
          <div className="kv"><span className="k">ssl mode</span><span className="v">{DATABASE.sslMode}</span></div>
          <div className="kv"><span className="k">last migration</span><span className="v">{DATABASE.lastMigration}</span></div>
        </Card>
        <Card title="Storage" sub={`${DATABASE.storage.used} ${DATABASE.storage.unit} of ${DATABASE.storage.total} ${DATABASE.storage.unit} used`}>
          <Bar pct={usedPct} />
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--fg-2)" }}>
            <span className="mono">{usedPct}% used</span>
            <span className="mono">{DATABASE.storage.total - DATABASE.storage.used} {DATABASE.storage.unit} free</span>
          </div>
          <div className="divider" />
          <div className="row" style={{ gap: 8 }}>
            <Pill kind="ok">backups: nightly</Pill>
            <Pill kind="ok">retention: 7 days</Pill>
            <Pill kind="muted">PITR: included</Pill>
          </div>
        </Card>
      </div>

      <Card title="Tables">
        <table className="tbl">
          <thead><tr><th>Table</th><th>Rows</th><th>Size</th></tr></thead>
          <tbody>
            {DATABASE.tables.map((t) => (
              <tr key={t.name}>
                <td className="mono">{t.name}</td>
                <td className="mono">{t.rows.toLocaleString()}</td>
                <td className="mono dim">{t.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// HEALTH & SLO
// ============================================================
function PageHealth() {
  const slos = [
    { name: "MatrixHub API availability",   target: "99.5%",  actual: "99.92%", budget: 88, status: "ok" },
    { name: "Catalog sync success rate",    target: "99%",    actual: "99.6%",  budget: 82, status: "ok" },
    { name: "Database connection",          target: "99.9%",  actual: "100%",   budget: 100,status: "ok" },
    { name: "SelfRepair scan completion",   target: "weekly", actual: "daily",  budget: 92, status: "ok" },
    { name: "HomePilot release p95 < 30s",  target: "95%",    actual: "97%",    budget: 78, status: "ok" },
    { name: "OllaBridge route error < 1%",  target: "99%",    actual: "98.2%",  budget: 38, status: "warn" },
  ];
  return (
    <div className="page">
      <PageHead title="Health & SLO" sub="ROLLING 28-DAY · LOW-BUDGET-AWARE TARGETS" />
      <div className="grid grid-3">
        {slos.map((s) => (
          <div key={s.name} className="card">
            <div className="card-head">
              <div>
                <div className="title">{s.name}</div>
                <div className="sub">target {s.target} · actual {s.actual}</div>
              </div>
              <div className="grow" />
              <Pill kind={statusKind(s.status)}>{s.status === "ok" ? "ON TRACK" : "AT RISK"}</Pill>
            </div>
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--fg-2)" }}>
                <span>error budget</span><span className="v">{s.budget}%</span>
              </div>
              <Bar pct={s.budget} kind={s.budget > 60 ? "" : s.budget > 30 ? "warn" : "err"} />
              <div style={{ marginTop: 10 }}>
                <Spark data={Array.from({ length: 14 }, () => Math.round(50 + Math.random() * s.budget))} w={300} h={36} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// LIVE LOGS
// ============================================================
function PageLogs() {
  const sources = ["catalog","selfrepair","generator","homepilot","ollabridge","db","auth","admin-api"];
  const verbs = ["accepted","emitted","rejected","retried","dispatched","sealed","rotated","synced","validated","scanned"];
  const objs = ["manifest","prompt","secret","job","route","release","issue","pr","migration"];
  const [lines, setLines] = usePgState(() => Array.from({ length: 22 }, () => genLog(sources, verbs, objs)));
  usePgEffect(() => {
    const id = setInterval(() => {
      setLines((ls) => [...ls.slice(-80), genLog(sources, verbs, objs)]);
    }, 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="page">
      <PageHead title="Live Logs" sub="STREAM · tail -f /var/log/matrixhub/admin.log"
        actions={<>
          <button className="btn ghost"><Icon name="pause" /> Pause</button>
          <button className="btn"><Icon name="filter" /> Filter</button>
          <button className="btn"><Icon name="download" /> Export</button>
        </>} />
      <Card>
        <pre className="code" style={{ maxHeight: 540, overflow: "auto", margin: 0, borderRadius: 0, border: 0 }}>
          {lines.map((l, i) => (
            <div key={i}>
              <span className="c">{l.t} </span>
              <span style={{ color: l.kind === "err" ? "var(--red-1)" : l.kind === "warn" ? "var(--amber-1)" : "var(--grn-1)" }}>[{l.kind.toUpperCase()}]</span>
              <span className="p"> {l.src}</span>
              <span> {l.verb} </span>
              <span className="g">{l.obj}</span>
              <span className="c"> id={l.id}</span>
            </div>
          ))}
        </pre>
      </Card>
    </div>
  );
}
function genLog(sources, verbs, objs) {
  const t = new Date().toISOString().split("T")[1].replace("Z","");
  const r = Math.random();
  const kind = r > 0.94 ? "err" : r > 0.85 ? "warn" : "ok";
  return {
    t, kind,
    src: sources[Math.floor(Math.random() * sources.length)],
    verb: verbs[Math.floor(Math.random() * verbs.length)],
    obj: objs[Math.floor(Math.random() * objs.length)],
    id: Math.random().toString(36).slice(2, 10),
  };
}

// ============================================================
// IAM
// ============================================================
function PageIAM() {
  return (
    <div className="page">
      <PageHead
        title="Identity & Access"
        sub={`${PEOPLE.length} PRINCIPALS · MFA POLICY: ENFORCED ON ADMINS`}
        actions={(
          <>
            <button className="btn ghost"><Icon name="download" /> Export audit</button>
            <button className="btn primary"><Icon name="plus" /> Invite</button>
          </>
        )}
      />
      <Card>
        <table className="tbl">
          <thead><tr><th>Principal</th><th>Email</th><th>Role</th><th>MFA</th><th>Scopes</th><th>Last active</th><th></th></tr></thead>
          <tbody>
            {PEOPLE.map((p) => (
              <tr key={p.name}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 999,
                      background: "linear-gradient(135deg, var(--grn-2), oklch(0.55 0.16 230))",
                      color: "#000", display: "grid", placeItems: "center",
                      fontFamily: "var(--mono)", fontWeight: 700, fontSize: 10
                    }}>{p.name.split(".").map(x => x[0]).join("").toUpperCase()}</div>
                    <div>{p.name}</div>
                  </div>
                </td>
                <td className="mono dim">{p.email}</td>
                <td><Pill kind={p.role === "OWNER" ? "ok" : p.role === "ADMIN" ? "info" : "muted"} dot={false}>{p.role}</Pill></td>
                <td>{p.mfa ? <Pill kind="ok">ENABLED</Pill> : <Pill kind="warn">REQUIRED</Pill>}</td>
                <td className="mono dim">{p.scopes.join(", ")}</td>
                <td className="mono dim">{p.last}</td>
                <td><button className="btn icon sm"><Icon name="dots" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// ENV & SECRETS (configured/missing only — never show values)
// ============================================================
function PageSecrets() {
  const configured = ENV_SECRETS.filter(s => s.status === "configured").length;
  const missing    = ENV_SECRETS.filter(s => s.status === "missing").length;
  const missingReq = ENV_SECRETS.filter(s => s.status === "missing" && s.required).length;
  return (
    <div className="page">
      <PageHead
        title="Env & Secrets"
        sub="STATUS ONLY · VALUES NEVER RENDERED · policy: secrets-never-render"
        actions={(
          <>
            <button className="btn"><Icon name="check" /> Verify config</button>
            <button className="btn primary"><Icon name="upload" /> Sync env from vault</button>
          </>
        )}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="CONFIGURED" value={configured} unit={`/${ENV_SECRETS.length}`} delta="present in env" trend="up"   spark={[5,5,6,6,6,7,7,7,7,7,7,7]} />
        <StatCard label="MISSING"     value={missing}     unit=""                        delta={`${missingReq} required`} trend="dn" spark={[2,2,2,2,3,3,3,3,3,3,3,3]} />
        <StatCard label="VAULT"       value="OK"          unit=""                        delta="kms-zion (mock)"  trend="zero" spark={[1,1,1,1,1,1,1,1,1,1,1,1]} />
        <StatCard label="ROTATION"    value="AUTO"        unit=""                        delta="quarterly default" trend="zero" spark={[1,1,1,1,1,1,1,1,1,1,1,1]} />
      </div>

      <Card title="Environment variables" sub="reflects /api/admin/env-status">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Scope</th><th>Required</th><th>Status</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            {ENV_SECRETS.map((s) => (
              <tr key={s.name}>
                <td className="mono">{s.name}</td>
                <td className="dim">{s.scope}</td>
                <td>{s.required ? <Pill kind="info" dot={false}>REQUIRED</Pill> : <Pill kind="muted" dot={false}>OPTIONAL</Pill>}</td>
                <td>{s.status === "configured"
                  ? <Pill kind="ok">CONFIGURED</Pill>
                  : <Pill kind={s.required ? "err" : "warn"}>MISSING</Pill>}</td>
                <td className="mono dim">{s.updated}</td>
                <td><div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn sm ghost"><Icon name="refresh" /> rotate</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// POLICIES
// ============================================================
function PagePolicies() {
  return (
    <div className="page">
      <PageHead title="Policies" sub="POLICY-AS-CODE · DRIFT DETECTION · GOVERNANCE BY DEFAULT"
        actions={<button className="btn primary"><Icon name="plus" /> New policy</button>} />
      <Card>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Scope</th><th>Status</th><th>Targets</th><th>Updated</th><th>Author</th><th></th></tr></thead>
          <tbody>
            {POLICIES.map((p) => (
              <tr key={p.name}>
                <td><div style={{ fontWeight: 500 }}>{p.name}</div></td>
                <td className="dim mono">{p.scope}</td>
                <td>{p.status === "enforced" ? <Pill kind="ok">ENFORCED</Pill> : <Pill kind="warn">AUDIT</Pill>}</td>
                <td className="mono">{p.targets}</td>
                <td className="mono dim">{p.updated}</td>
                <td>{p.author}</td>
                <td><div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn sm ghost">Diff</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// COSTS (honest €0 + sponsor tiers)
// ============================================================
function PageCosts() {
  return (
    <div className="page">
      <PageHead
        title="Costs & Budget"
        sub={`${COSTS.current.period} · current spend ${COSTS.current.currency}${COSTS.current.total} · low-budget by design`}
      />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <StatCard label="MONTH TO DATE"  value="€0"  delta="vs €0 last month" trend="zero" spark={[0,0,0,0,0,0,0,0,0,0,0,0]} />
        <StatCard label="PROJECTED EOM"  value="€0"  delta="assuming current routes" trend="zero" spark={[0,0,0,0,0,0,0,0,0,0,0,0]} />
        <StatCard label="HF PRO"          value="OFF" delta="turn on for stable demos" trend="zero" spark={[0,0,0,0,0,0,0,0,0,0,0,0]} />
      </div>

      <div className="split-2" style={{ marginBottom: 16 }}>
        <Card title="Provider spend">
          <table className="tbl">
            <thead><tr><th>Provider</th><th>Plan</th><th>Spend</th><th>Notes</th></tr></thead>
            <tbody>
              {COSTS.providers.map((p) => (
                <tr key={p.name}>
                  <td><div style={{ fontWeight: 500 }}>{p.name}</div></td>
                  <td className="mono dim">{p.plan}</td>
                  <td className="mono">€{p.spend}</td>
                  <td className="dim">{p.note}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--bg-1)" }}>
                <td colSpan={2} style={{ textAlign: "right", color: "var(--fg-2)" }}>Total</td>
                <td className="mono" style={{ fontWeight: 600 }}>€0</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="Sponsor tiers" sub="when a tier is funded, unlock the listed capability">
          <div className="col" style={{ gap: 10 }}>
            {COSTS.sponsorTiers.map((t) => (
              <div key={t.amount} className="sponsor-tier">
                <div className="sponsor-amt">€{t.amount}<span>/mo</span></div>
                <div className="sponsor-body">
                  <div className="sponsor-label">{t.label}</div>
                  <div className="sponsor-unlock">{t.unlock}</div>
                </div>
                <button className="btn sm">Sponsor</button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Cost guard">
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Pill kind="ok">policy: deny-expensive-route ENFORCED</Pill>
          <Pill kind="ok">HomePilot inference runs locally</Pill>
          <Pill kind="ok">Generator runs human-gated</Pill>
          <Pill kind="muted">HF Pro auto-enable threshold: 60 free req/h hit</Pill>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// LINKS
// ============================================================
function PageLinks() {
  const grouped = LINKS.reduce((m, l) => ((m[l.category] = m[l.category] || []).push(l), m), {});
  const order = ["deploy","infra","data","catalog","runtime","infer","network","observe","docs"];
  return (
    <div className="page">
      <PageHead
        title="Links"
        sub={`${LINKS.length} external admin consoles · seeded from admin_links table`}
        actions={<button className="btn primary"><Icon name="plus" /> Add link</button>}
      />
      {order.filter(k => grouped[k]).map((k) => (
        <div key={k} style={{ marginBottom: 16 }}>
          <div className="page-sub" style={{ marginBottom: 8 }}>{k.toUpperCase()}</div>
          <div className="grid grid-3">
            {grouped[k].map((l) => (
              <a key={l.name} className="card link-card" href={l.url} target="_blank" rel="noopener">
                <div className="card-body">
                  <div className="row" style={{ gap: 10 }}>
                    <Icon name="branch" color="var(--grn-1)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{l.name}</div>
                      <div className="page-sub" style={{ fontSize: 11, marginTop: 2 }}>{l.desc}</div>
                    </div>
                    <Icon name="upload" color="var(--fg-3)" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SETTINGS
// ============================================================
function PageSettings() {
  const [opts, setOpts] = usePgState({
    catalogAutosync: true,
    selfrepairDaily: true,
    generatorGated: true,
    denyExpensive: true,
    pii: true,
    matrixRain: true,
  });
  const toggle = (k) => setOpts({ ...opts, [k]: !opts[k] });
  const rows = [
    { k: "catalogAutosync", label: "Auto-sync catalog from GitHub",        sub: "Polls main branch every 10 minutes for new or changed manifests." },
    { k: "selfrepairDaily", label: "SelfRepair daily scan",                 sub: "Runs at 03:00 UTC; opens GitHub issues and PRs only — never modifies prod runtime." },
    { k: "generatorGated",  label: "Agent-Generator: human-gated",          sub: "Required: every generation run must be approved by an OWNER or ADMIN." },
    { k: "denyExpensive",   label: "Deny expensive inference by default",   sub: "Anthropic/OpenAI platform routes blocked unless explicitly enabled per session." },
    { k: "pii",             label: "Redact PII before model dispatch",      sub: "HomePilot applies prompt-redaction-pii policy locally." },
    { k: "matrixRain",      label: "Matrix rain backdrop",                  sub: "Decorative animated background. Off in screenshots / on physical screens for embedded mode." },
  ];
  return (
    <div className="page">
      <PageHead title="Settings" sub="TENANT // agent-matrix · PLAN // FREE" />
      <Card title="Operational defaults">
        {rows.map((r) => (
          <div key={r.k} className="row" style={{ justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed var(--line-1)" }}>
            <div style={{ maxWidth: 540 }}>
              <div style={{ fontWeight: 500 }}>{r.label}</div>
              <div className="page-sub" style={{ fontSize: 11 }}>{r.sub}</div>
            </div>
            <Switch on={opts[r.k]} onChange={() => toggle(r.k)} />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ============================================================
// AUDIT (stub list view)
// ============================================================
function PageAudit() {
  const audit = [
    { t: "08:43:02", who: "selfrepair@bot",    action: "scan.complete",     obj: "catalog",            outcome: "9 healthy / 2 warn / 1 fail" },
    { t: "08:42:17", who: "admin@cron",        action: "catalog.sync",      obj: "github:main",        outcome: "+1 manifest" },
    { t: "08:30:11", who: "trinity.morgan",    action: "generator.run",     obj: "template:research",  outcome: "PR #88 opened" },
    { t: "08:24:09", who: "homepilot@release", action: "release.publish",   obj: "v0.4.1",             outcome: "signed" },
    { t: "08:06:21", who: "trinity.morgan",    action: "policy.approve",    obj: "deny-expensive-route", outcome: "enforced" },
  ];
  return (
    <div className="page">
      <PageHead title="Audit Trail" sub="IMMUTABLE LEDGER · WRITES TO audit_log TABLE" />
      <Card>
        <table className="tbl">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Object</th><th>Outcome</th></tr></thead>
          <tbody>
            {audit.map((a, i) => (
              <tr key={i}>
                <td className="mono dim">{a.t}</td>
                <td className="mono">{a.who}</td>
                <td><Pill kind="info" dot={false}>{a.action}</Pill></td>
                <td className="mono dim">{a.obj}</td>
                <td>{a.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// Generic stub
// ============================================================
function PageStub({ title, sub }) {
  return (
    <div className="page">
      <PageHead title={title} sub={sub || "MODULE LOADED · NO DATA"} />
      <Card>
        <pre className="ascii" style={{ padding: 12 }}>
{`  ┌──────────────────────────────────────────────┐
  │ MODULE  : ${(title + "                       ").slice(0, 28)} │
  │ STATE   : initialized                         │
  │ STREAM  : pending first packet                │
  └──────────────────────────────────────────────┘`}
        </pre>
      </Card>
    </div>
  );
}

// expose
window.MATRIX_PAGES = {
  PageOverview, PageAliveLoop, PageCatalog, PageAgents, PageGenerator, PageSelfRepair,
  PageHomePilot, PageOllaBridge, PageInfra, PageDatabase, PageHealth, PageLogs,
  PageIAM, PageSecrets, PagePolicies, PageCosts, PageLinks, PageSettings, PageAudit, PageStub,
};
