/* global React */
// ============================================================
// Matrix Cloud Admin — UI atoms
// ============================================================
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icon (inline 14px SVG set) ----------
function Icon({ name, size = 14, color = "currentColor" }) {
  const s = size;
  const stroke = { stroke: color, strokeWidth: 1.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const filled = { fill: color, stroke: "none" };
  const map = {
    grid:     (<><rect x="2" y="2" width="5" height="5" {...stroke}/><rect x="9" y="2" width="5" height="5" {...stroke}/><rect x="2" y="9" width="5" height="5" {...stroke}/><rect x="9" y="9" width="5" height="5" {...stroke}/></>),
    bot:      (<><rect x="3" y="5" width="10" height="8" rx="2" {...stroke}/><circle cx="6.5" cy="9" r="0.8" {...filled}/><circle cx="9.5" cy="9" r="0.8" {...filled}/><path d="M8 2v3" {...stroke}/><circle cx="8" cy="2" r="0.8" {...filled}/></>),
    server:   (<><rect x="2" y="3" width="12" height="4" rx="1" {...stroke}/><rect x="2" y="9" width="12" height="4" rx="1" {...stroke}/><circle cx="5" cy="5" r="0.6" {...filled}/><circle cx="5" cy="11" r="0.6" {...filled}/></>),
    catalog:  (<><path d="M3 3h6l1 2h3v8H3z" {...stroke}/><path d="M3 7h10" {...stroke}/></>),
    rocket:   (<><path d="M11 3l2 2-5 5-3 1 1-3 5-5z" {...stroke}/><path d="M5 11l-2 2 1 1 2-2" {...stroke}/></>),
    db:       (<><ellipse cx="8" cy="4" rx="5" ry="1.6" {...stroke}/><path d="M3 4v8c0 0.9 2.2 1.6 5 1.6s5-0.7 5-1.6V4" {...stroke}/><path d="M3 8c0 0.9 2.2 1.6 5 1.6s5-0.7 5-1.6" {...stroke}/></>),
    disk:     (<><circle cx="8" cy="8" r="6" {...stroke}/><circle cx="8" cy="8" r="2" {...stroke}/></>),
    wave:     (<><path d="M2 8c2-3 4 3 6 0s4 3 6 0" {...stroke}/></>),
    book:     (<><path d="M3 2h7a3 3 0 013 3v9H6a3 3 0 01-3-3z" {...stroke}/><path d="M3 11a3 3 0 013-3h7" {...stroke}/></>),
    heart:    (<><path d="M2 6c0-2 2-3.5 4-2.5 1 0.5 1.5 1.5 2 2 0.5-0.5 1-1.5 2-2 2-1 4 0.5 4 2.5 0 3-4 6-6 7-2-1-6-4-6-7z" {...stroke}/></>),
    terminal: (<><rect x="2" y="3" width="12" height="10" rx="1" {...stroke}/><path d="M5 7l2 1.5L5 10" {...stroke}/><path d="M8 10h4" {...stroke}/></>),
    trace:    (<><circle cx="3.5" cy="8" r="1.5" {...stroke}/><circle cx="12.5" cy="8" r="1.5" {...stroke}/><path d="M5 8h6" {...stroke}/><circle cx="8" cy="4" r="1.5" {...stroke}/><path d="M8 5.5v2" {...stroke}/></>),
    metric:   (<><path d="M2 13l3-4 3 2 3-6 3 4" {...stroke}/></>),
    users:    (<><circle cx="6" cy="6" r="2.5" {...stroke}/><path d="M2 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" {...stroke}/><circle cx="11" cy="6.5" r="1.8" {...stroke}/><path d="M9.5 13c0-2 1.5-3 3-3s2.5 1 2.5 2" {...stroke}/></>),
    key:      (<><circle cx="5" cy="8" r="2.5" {...stroke}/><path d="M7.5 8h6l-1.5 2M11 8v2" {...stroke}/></>),
    shield:   (<><path d="M8 2l5 2v4c0 3-2.5 5-5 6-2.5-1-5-3-5-6V4z" {...stroke}/></>),
    scroll:   (<><path d="M3 3h8v8c0 1 1 2 2 2h-7c-1 0-2-1-2-2z" {...stroke}/><path d="M5 5h4M5 7h4M5 9h4" {...stroke}/></>),
    coin:     (<><circle cx="8" cy="8" r="5.5" {...stroke}/><path d="M6.5 6.5h2c0.8 0 1.5 0.5 1.5 1.5s-0.7 1.5-1.5 1.5h-2v-3zm0 3v2M8 4.5v1m0 5v1" {...stroke}/></>),
    cog:      (<><circle cx="8" cy="8" r="2" {...stroke}/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M3.8 12.2l1-1M11.2 4.8l1-1" {...stroke}/></>),
    chat:     (<><path d="M2 3h12v8H6l-3 3V3z" {...stroke}/></>),
    plus:     (<><path d="M8 3v10M3 8h10" {...stroke}/></>),
    refresh:  (<><path d="M13 3v4h-4" {...stroke}/><path d="M3 13v-4h4" {...stroke}/><path d="M3.5 7a5 5 0 019-1.5L13 7M12.5 9a5 5 0 01-9 1.5L3 9" {...stroke}/></>),
    chevron:  (<><path d="M6 4l4 4-4 4" {...stroke}/></>),
    search:   (<><circle cx="7" cy="7" r="4" {...stroke}/><path d="M10 10l3.5 3.5" {...stroke}/></>),
    bell:     (<><path d="M4 11V8a4 4 0 018 0v3l1 2H3z" {...stroke}/><path d="M6.5 13.5a1.5 1.5 0 003 0" {...stroke}/></>),
    download: (<><path d="M8 2v8m-3-3l3 3 3-3" {...stroke}/><path d="M3 12v1h10v-1" {...stroke}/></>),
    upload:   (<><path d="M8 11V3m-3 3l3-3 3 3" {...stroke}/><path d="M3 12v1h10v-1" {...stroke}/></>),
    play:     (<><path d="M5 3l8 5-8 5z" {...filled}/></>),
    pause:    (<><rect x="4" y="3" width="3" height="10" {...filled}/><rect x="9" y="3" width="3" height="10" {...filled}/></>),
    stop:     (<><rect x="3" y="3" width="10" height="10" {...filled}/></>),
    dots:     (<><circle cx="3.5" cy="8" r="1" {...filled}/><circle cx="8" cy="8" r="1" {...filled}/><circle cx="12.5" cy="8" r="1" {...filled}/></>),
    copy:     (<><rect x="3" y="3" width="8" height="8" rx="1" {...stroke}/><path d="M5 5V3h8v8h-2" {...stroke}/></>),
    eye:      (<><path d="M1.5 8s2-4.5 6.5-4.5S14.5 8 14.5 8 12.5 12.5 8 12.5 1.5 8 1.5 8z" {...stroke}/><circle cx="8" cy="8" r="2" {...stroke}/></>),
    eyeOff:   (<><path d="M3 3l10 10" {...stroke}/><path d="M2 8s2-4.5 6.5-4.5c1.2 0 2.3 0.3 3.2 0.7M14 8s-2 4.5-6.5 4.5c-1.2 0-2.3-0.3-3.2-0.7" {...stroke}/></>),
    x:        (<><path d="M4 4l8 8M12 4l-8 8" {...stroke}/></>),
    check:    (<><path d="M3 8l3 3 7-7" {...stroke}/></>),
    lock:     (<><rect x="3" y="7" width="10" height="6" rx="1" {...stroke}/><path d="M5 7V5a3 3 0 016 0v2" {...stroke}/></>),
    branch:   (<><circle cx="4" cy="3" r="1.5" {...stroke}/><circle cx="4" cy="13" r="1.5" {...stroke}/><circle cx="12" cy="6" r="1.5" {...stroke}/><path d="M4 4.5v7M4 8c0-1.5 1.5-2 4-2.5" {...stroke}/></>),
    pulse:    (<><path d="M2 8h3l1.5-4 2 8 1.5-4h4" {...stroke}/></>),
    map:      (<><path d="M2 3l4-1 4 1 4-1v11l-4 1-4-1-4 1z" {...stroke}/><path d="M6 2v11M10 3v11" {...stroke}/></>),
    cube:     (<><path d="M8 2l5 3v6l-5 3-5-3V5z" {...stroke}/><path d="M3 5l5 3 5-3M8 8v6" {...stroke}/></>),
    tag:      (<><path d="M2 8V3h5l7 7-5 5z" {...stroke}/><circle cx="5.5" cy="5.5" r="0.8" {...filled}/></>),
    filter:   (<><path d="M2 3h12l-4.5 5v5l-3-1V8z" {...stroke}/></>),
  };
  return (
    <svg viewBox="0 0 16 16" width={s} height={s} className="ico" aria-hidden>
      {map[name] || map.cube}
    </svg>
  );
}

// ---------- Status pill ----------
function Pill({ kind = "muted", children, dot = true }) {
  return (
    <span className={`pill ${kind}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

// ---------- Toggle switch ----------
function Switch({ on, onChange }) {
  return (
    <div
      className={`switch ${on ? "on" : ""}`}
      role="switch" aria-checked={on}
      onClick={() => onChange && onChange(!on)}
    />
  );
}

// ---------- Card ----------
function Card({ title, sub, action, children, foot }) {
  return (
    <div className="card">
      {(title || action) && (
        <div className="card-head">
          {title && <div className="title">{title}</div>}
          {sub && <div className="sub">{sub}</div>}
          <div className="grow" />
          {action}
        </div>
      )}
      <div className="card-body">{children}</div>
      {foot && <div className="card-foot">{foot}</div>}
    </div>
  );
}

// ---------- Sparkline (svg) ----------
function Spark({ data = [], stroke = "var(--grn-1)", fill = "var(--grn-bg)", w = 120, h = 28 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = (max - min) || 1;
  const step = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 2) - 1]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fillD = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none">
      <path d={fillD} fill={fill} />
      <path d={d} stroke={stroke} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

// ---------- StatCard (KPI tile) ----------
function StatCard({ label, value, unit, delta, trend, spark }) {
  const deltaClass =
    trend === "dn" ? "delta dn" : trend === "zero" ? "delta zero" : "delta";
  const arrow = trend === "dn" ? "▾" : trend === "zero" ? "·" : "▴";
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className={deltaClass}>
        <span>{arrow}</span> {delta}
      </div>
      <div className="spark">
        <Spark data={spark} />
      </div>
    </div>
  );
}

// ---------- Resource bar (cpu/mem etc) ----------
function Bar({ pct, kind }) {
  const cap = Math.max(0, Math.min(100, pct));
  const cls =
    kind ? kind : cap > 85 ? "err" : cap > 70 ? "warn" : "";
  return (
    <div className={`bar ${cls}`} title={`${cap}%`}>
      <span style={{ width: `${cap}%` }} />
    </div>
  );
}

// ---------- Matrix rain backdrop (very subtle) ----------
function MatrixRain() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, cols, drops;
    const chars = "01ABCDEFあいうエオカキクケコ<>{}/[];アクセスマトリックス".split("");

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
      const fs = 14;
      cols = Math.floor(w / fs);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    }
    resize();
    window.addEventListener("resize", resize);

    let raf;
    function draw() {
      ctx.fillStyle = "rgba(7, 9, 10, 0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "12px JetBrains Mono, monospace";
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 14;
        const y = drops[i] * 14;
        ctx.fillStyle = `rgba(120, 220, 160, ${Math.random() * 0.5 + 0.15})`;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        else drops[i] += 0.6;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div className="matrix-rain">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------- Status dot helper ----------
function statusToPill(s) {
  if (s === "ok" || s === "running") return ["ok", s === "ok" ? "HEALTHY" : "RUNNING"];
  if (s === "warn" || s === "throttled") return ["warn", s.toUpperCase()];
  if (s === "err" || s === "error") return ["err", "ERROR"];
  if (s === "idle") return ["muted", "IDLE"];
  return ["muted", String(s).toUpperCase()];
}

// expose
window.MATRIX_UI = { Icon, Pill, Switch, Card, Spark, StatCard, Bar, MatrixRain, statusToPill };
