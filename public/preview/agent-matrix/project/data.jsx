/* global window */
// ============================================================
// Matrix Cloud Admin — Agent-Matrix ecosystem data
// Honest defaults: €0 budget, real providers, configured/missing.
// ============================================================

const NAV = [
  {
    group: "Mission",
    items: [
      { id: "overview",   label: "Mission Control",  icon: "grid",     shortcut: "M" },
      { id: "alive",      label: "Alive Loop",       icon: "pulse",    badge: { kind: "ok", text: "live" } },
      { id: "links",      label: "Links",            icon: "branch" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { id: "catalog",    label: "Catalog",          icon: "catalog" },
      { id: "agents",     label: "Agents",           icon: "bot" },
      { id: "generator",  label: "Agent-Generator",  icon: "rocket",   badge: { kind: "warn", text: "2 PR" } },
      { id: "selfrepair", label: "SelfRepair",       icon: "heart",    badge: { kind: "warn", text: "!" } },
    ],
  },
  {
    group: "Runtime",
    items: [
      { id: "homepilot",  label: "HomePilot",        icon: "cube" },
      { id: "ollabridge", label: "OllaBridge",       icon: "wave" },
      { id: "infrastructure", label: "Infrastructure", icon: "server" },
      { id: "database",   label: "Database",         icon: "db" },
    ],
  },
  {
    group: "Observe",
    items: [
      { id: "health",     label: "Health & SLO",     icon: "heart" },
      { id: "logs",       label: "Live Logs",        icon: "terminal" },
    ],
  },
  {
    group: "Govern",
    items: [
      { id: "iam",        label: "IAM & Roles",      icon: "users" },
      { id: "secrets",    label: "Env & Secrets",    icon: "key" },
      { id: "policies",   label: "Policies",         icon: "shield" },
      { id: "audit",      label: "Audit Trail",      icon: "scroll" },
    ],
  },
  {
    group: "Admin",
    items: [
      { id: "costs",      label: "Costs & Budget",   icon: "coin" },
      { id: "settings",   label: "Settings",         icon: "cog" },
      { id: "support",    label: "Support",          icon: "chat" },
    ],
  },
];

// ---------- Honest KPIs for Mission Control ----------
const KPIS = [
  { label: "CATALOG ITEMS",       value: 12,       unit: "",       delta: "+1 (24h)",     trend: "up",   spark: [3,4,5,6,6,7,8,9,10,11,11,12] },
  { label: "HEALTHY",             value: 9,        unit: "/12",    delta: "+2",           trend: "up",   spark: [5,5,6,6,7,7,8,8,8,9,9,9] },
  { label: "OPEN ISSUES",         value: 3,        unit: "",       delta: "SelfRepair",   trend: "dn",   spark: [0,0,1,1,2,2,2,3,3,3,3,3] },
  { label: "PUBLISH PRs",         value: 2,        unit: "",       delta: "from Generator", trend: "zero", spark: [0,0,0,1,1,1,2,2,2,2,2,2] },
  { label: "MONTHLY COST",        value: "€0",     unit: "",       delta: "free tier",    trend: "zero", spark: [0,0,0,0,0,0,0,0,0,0,0,0] },
  { label: "INFERENCE ROUTE",     value: "LOCAL",  unit: "",       delta: "HF Pro: off",  trend: "zero", spark: [1,1,1,1,1,1,1,1,1,1,1,1] },
];

// ---------- Service registry (Phase 6: single source of truth) ----------
// status: ok | warn | err | unknown; "configured" reflects env vars / creds present
const SERVICES = [
  { id: "matrixhub_frontend", name: "MatrixHub Frontend",   category: "Frontend",   provider: "Vercel",        url: "https://matrixhub.io",          admin: "https://vercel.com",                 status: "ok",     configured: true,  notes: "Next.js · Free tier" },
  { id: "matrixhub_admin",    name: "Matrix Cloud Admin",    category: "Frontend",   provider: "Vercel",        url: "https://admin.matrixhub.io",    admin: "https://vercel.com",                 status: "ok",     configured: true,  notes: "this app" },
  { id: "matrixhub_api",      name: "MatrixHub API",         category: "API",        provider: "OCI Always-Free",url: "https://api.matrixhub.io",     admin: "https://cloud.oracle.com",           status: "ok",     configured: true,  notes: "FastAPI · 1× ARM micro" },
  { id: "aiven_postgres",     name: "PostgreSQL",            category: "Data",       provider: "Aiven",         url: "—",                              admin: "https://console.aiven.io",           status: "ok",     configured: true,  notes: "managed PG 16 · SSL" },
  { id: "catalog",            name: "Catalog Repo",          category: "Catalog",    provider: "GitHub",        url: "https://github.com/agent-matrix/catalog", admin: "https://github.com/agent-matrix/catalog", status: "ok", configured: true, notes: "manifests · source of truth" },
  { id: "selfrepair",         name: "SelfRepair",            category: "Automation", provider: "GitHub Actions",url: "https://github.com/agent-matrix/selfrepair", admin: "https://github.com/agent-matrix/selfrepair/actions", status: "warn", configured: true, notes: "3 open issues" },
  { id: "agent_generator",    name: "Agent-Generator",       category: "Automation", provider: "GitHub Actions",url: "https://github.com/agent-matrix/agent-generator", admin: "https://github.com/agent-matrix/agent-generator/actions", status: "ok", configured: true, notes: "human-gated runs" },
  { id: "homepilot",          name: "HomePilot",             category: "Runtime",    provider: "Local app",     url: "https://github.com/agent-matrix/homepilot", admin: "https://github.com/agent-matrix/homepilot/releases", status: "ok", configured: true, notes: "local-first runtime" },
  { id: "ollabridge",         name: "OllaBridge",            category: "Inference",  provider: "Local / HF",    url: "https://github.com/agent-matrix/ollabridge", admin: "https://huggingface.co/agent-matrix", status: "ok", configured: true, notes: "local → user key → HF" },
  { id: "huggingface",        name: "Hugging Face",          category: "Inference",  provider: "Hugging Face",  url: "https://huggingface.co/agent-matrix", admin: "https://huggingface.co/settings", status: "ok", configured: true, notes: "HF Pro: OFF" },
  { id: "github_actions",     name: "GitHub Actions",        category: "Automation", provider: "GitHub",        url: "https://github.com/agent-matrix", admin: "https://github.com/agent-matrix", status: "ok", configured: true, notes: "free minutes" },
  { id: "cloudflare",         name: "DNS / Edge",            category: "Network",    provider: "Cloudflare",    url: "—",                              admin: "https://dash.cloudflare.com",        status: "ok",     configured: true,  notes: "DNS only · Free" },
];

// ---------- Manifests / catalog items ----------
const CATALOG = [
  { code: "AGT", name: "neo.research",         type: "agent",     repo: "agent-matrix/neo-research",       version: "0.4.2", health: "ok",   route: "local",     compat: ["homepilot@>=0.3"], installs: 184, validated: "2h ago" },
  { code: "AGT", name: "trinity.ops",           type: "agent",     repo: "agent-matrix/trinity-ops",        version: "0.3.1", health: "ok",   route: "local",     compat: ["homepilot@>=0.3"], installs: 142, validated: "2h ago" },
  { code: "AGT", name: "morpheus.router",       type: "agent",     repo: "agent-matrix/morpheus-router",    version: "0.5.0", health: "ok",   route: "user-key",  compat: ["homepilot@>=0.4"], installs: 98,  validated: "30m ago" },
  { code: "AGT", name: "oracle.eval",           type: "agent",     repo: "agent-matrix/oracle-eval",        version: "0.2.0", health: "warn", route: "hf-demo",   compat: ["homepilot@>=0.4"], installs: 41,  validated: "1d ago" },
  { code: "AGT", name: "tank.ingest",           type: "agent",     repo: "agent-matrix/tank-ingest",        version: "0.1.7", health: "ok",   route: "local",     compat: ["homepilot@>=0.3"], installs: 26,  validated: "4h ago" },
  { code: "PER", name: "persona.architect",     type: "persona",   repo: "agent-matrix/persona-architect",  version: "1.0.0", health: "ok",   route: "—",         compat: ["homepilot@>=0.3"], installs: 312, validated: "12h ago" },
  { code: "PER", name: "persona.mentor",        type: "persona",   repo: "agent-matrix/persona-mentor",     version: "0.9.4", health: "ok",   route: "—",         compat: ["homepilot@>=0.3"], installs: 220, validated: "12h ago" },
  { code: "TOL", name: "tool.web-fetch",        type: "tool",      repo: "agent-matrix/tool-web-fetch",     version: "0.2.1", health: "ok",   route: "—",         compat: ["all"],             installs: 401, validated: "6h ago" },
  { code: "TOL", name: "tool.filesystem",       type: "tool",      repo: "agent-matrix/tool-filesystem",    version: "0.3.0", health: "ok",   route: "—",         compat: ["all"],             installs: 388, validated: "6h ago" },
  { code: "MCP", name: "mcp.postgres",          type: "mcp_server",repo: "agent-matrix/mcp-postgres",       version: "0.1.4", health: "ok",   route: "—",         compat: ["all"],             installs: 64,  validated: "2d ago" },
  { code: "MCP", name: "mcp.git",               type: "mcp_server",repo: "agent-matrix/mcp-git",            version: "0.2.0", health: "warn", route: "—",         compat: ["all"],             installs: 88,  validated: "2d ago" },
  { code: "AGT", name: "cypher.eval-runner",    type: "agent",     repo: "agent-matrix/cypher-eval-runner", version: "0.1.0", health: "err",  route: "local",     compat: ["homepilot@>=0.4"], installs: 12,  validated: "—" },
];

// ---------- Alive loop snapshot ----------
const ALIVE = [
  { step: 1, key: "discover",   title: "Discover",        sub: "scan catalog repo for new manifests",       status: "ok",   last: "08:42 UTC", detail: "12 manifests · 1 new since last scan" },
  { step: 2, key: "validate",   title: "Validate",        sub: "schema · permissions · runtime compat",     status: "ok",   last: "08:42 UTC", detail: "11 valid · 1 invalid (cypher.eval-runner)" },
  { step: 3, key: "install",    title: "Install",         sub: "index in MatrixHub · update PG",            status: "ok",   last: "08:43 UTC", detail: "indexed in 1.2s" },
  { step: 4, key: "run",        title: "Run",             sub: "HomePilot loads persona+agent locally",     status: "ok",   last: "—",         detail: "local-first · no central inference" },
  { step: 5, key: "observe",    title: "Observe",         sub: "telemetry · errors · regressions",          status: "warn", last: "08:38 UTC", detail: "1 agent flagged: oracle.eval regression" },
  { step: 6, key: "repair",     title: "Repair",          sub: "SelfRepair scan · open issues + PRs",       status: "warn", last: "03:00 UTC", detail: "3 issues open · next scan in 7h" },
  { step: 7, key: "republish",  title: "Republish",       sub: "Agent-Generator publishes fix PRs",         status: "ok",   last: "yesterday", detail: "2 PRs pending review" },
  { step: 8, key: "learn",      title: "Learn",           sub: "feedback into prompts/policies/templates",  status: "ok",   last: "weekly",    detail: "next learning cycle Sun 02:00 UTC" },
];

// ---------- SelfRepair status ----------
const SELFREPAIR = {
  lastScan: "2026-05-26 03:00 UTC",
  nextScan: "2026-05-27 03:00 UTC",
  healthy: 9,
  warnings: 2,
  failures: 1,
  issues: [
    { id: "SR-118", agent: "oracle.eval",         severity: "warn", title: "math_hard suite regression −0.8pp",         opened: "1d ago", pr: null },
    { id: "SR-119", agent: "mcp.git",             severity: "warn", title: "stale dependency: nodegit 0.x → 1.x",       opened: "2d ago", pr: "#42" },
    { id: "SR-120", agent: "cypher.eval-runner",  severity: "err",  title: "manifest schema invalid: missing runtime",   opened: "4h ago", pr: "#43" },
  ],
  actions: "https://github.com/agent-matrix/selfrepair/actions",
};

// ---------- Agent-Generator status ----------
const GENERATOR = {
  recent: [
    { id: "gen-2026-05-26-01", template: "research-agent",    name: "apoc.research",      status: "pending-pr", pr: "#88",  opened: "3h ago",  author: "trinity" },
    { id: "gen-2026-05-25-04", template: "router-agent",      name: "switch.relay-v2",    status: "pending-pr", pr: "#87",  opened: "1d ago",  author: "morpheus" },
    { id: "gen-2026-05-24-02", template: "ingest-agent",      name: "dozer.ingest-rss",   status: "merged",     pr: "#84",  opened: "2d ago",  author: "tank" },
    { id: "gen-2026-05-22-07", template: "persona",           name: "persona.skeptic",    status: "failed",     pr: "—",    opened: "4d ago",  author: "neo",      err: "schema validation failed" },
  ],
  templates: ["research-agent","router-agent","ingest-agent","eval-runner","persona","mcp-server-skel"],
};

// ---------- HomePilot ----------
const HOMEPILOT = {
  version: "0.4.1",
  release: "2026-05-21",
  download: "https://github.com/agent-matrix/homepilot/releases/latest",
  mode: "local-first",
  compatPersonas: ["persona.architect","persona.mentor","persona.skeptic*"],
  recentInstalls: [
    { os: "macOS 14",     count: 1822 },
    { os: "Windows 11",   count: 1411 },
    { os: "Ubuntu 22.04", count: 904 },
    { os: "Fedora 40",    count: 184 },
  ],
};

// ---------- OllaBridge routing ----------
const OLLABRIDGE = {
  policy: "local → user-key → hf-demo (gated)",
  budget: "€0/mo",
  todayRequests: 24180,
  routes: [
    { name: "local Ollama",       enabled: true,  share: 78, cost: "€0",  note: "default · zero cost" },
    { name: "user-provided keys", enabled: true,  share: 19, cost: "€0",  note: "passthrough · no platform cost" },
    { name: "HF demo (free)",     enabled: true,  share: 3,  cost: "€0",  note: "gated · 60 req/h" },
    { name: "HF Pro",             enabled: false, share: 0,  cost: "€9",  note: "off · turn on for stable demos" },
    { name: "Anthropic platform", enabled: false, share: 0,  cost: "$$",  note: "off · expensive · human-gated only" },
  ],
};

// ---------- Database (Aiven) ----------
const DATABASE = {
  provider: "Aiven",
  engine: "PostgreSQL 16.3",
  host: "matrix-pg-***.aivencloud.com",
  port: 23476,
  database: "matrixhub",
  sslMode: "verify-full",
  lastMigration: "0027_service_registry",
  storage: { used: 184, total: 1024, unit: "MB" },
  tables: [
    { name: "catalog_items",      rows: 12,      size: "120 KB" },
    { name: "service_registry",   rows: 12,      size: "32 KB"  },
    { name: "admin_links",        rows: 18,      size: "28 KB"  },
    { name: "selfrepair_issues",  rows: 3,       size: "12 KB"  },
    { name: "generator_runs",     rows: 7,       size: "44 KB"  },
    { name: "users",              rows: 4,       size: "8 KB"   },
    { name: "audit_log",          rows: 18421,   size: "8.4 MB" },
  ],
};

// ---------- Env / Secrets — never show values ----------
const ENV_SECRETS = [
  { name: "DATABASE_URL",       scope: "core",    status: "configured", required: true,  updated: "30d ago" },
  { name: "ADMIN_SESSION_SECRET",scope: "auth",   status: "configured", required: true,  updated: "30d ago" },
  { name: "ADMIN_PASSWORD_HASH", scope: "auth",   status: "configured", required: true,  updated: "30d ago" },
  { name: "HUB_API_TOKEN",       scope: "core",   status: "configured", required: true,  updated: "12d ago" },
  { name: "GITHUB_TOKEN",        scope: "ci",     status: "configured", required: true,  updated: "5d ago" },
  { name: "VERCEL_TOKEN",        scope: "deploy", status: "configured", required: false, updated: "60d ago" },
  { name: "AIVEN_PASSWORD",      scope: "data",   status: "configured", required: true,  updated: "180d ago" },
  { name: "HF_TOKEN",            scope: "infer",  status: "missing",    required: false, updated: "—" },
  { name: "ANTHROPIC_API_KEY",   scope: "infer",  status: "missing",    required: false, updated: "—" },
  { name: "SLACK_WEBHOOK",       scope: "alerts", status: "missing",    required: false, updated: "—" },
];

// ---------- Costs (honest €0 + sponsor tiers) ----------
const COSTS = {
  current: { total: 0, currency: "€", period: "May 2026" },
  providers: [
    { name: "Vercel",       plan: "Hobby",          spend: 0, note: "free tier · enough for admin + frontend" },
    { name: "OCI",          plan: "Always Free",    spend: 0, note: "1× ARM Ampere micro · enough for API" },
    { name: "Aiven",        plan: "Free trial",     spend: 0, note: "small PG 16 instance" },
    { name: "GitHub",       plan: "Free",           spend: 0, note: "actions free minutes" },
    { name: "Hugging Face", plan: "Free",           spend: 0, note: "HF Pro off · gated demo quota" },
    { name: "Cloudflare",   plan: "Free",           spend: 0, note: "DNS only" },
  ],
  sponsorTiers: [
    { amount: 9,   label: "Hugging Face Pro",     unlock: "stable demos for catalog showcases" },
    { amount: 25,  label: "Better monitoring",    unlock: "uptime checks + extended demo quota" },
    { amount: 100, label: "Hosted OllaBridge α",  unlock: "shared inference router (still local-first)" },
    { amount: 500, label: "Dedicated experiments",unlock: "fine-tune & eval budget for new agents" },
  ],
};

// ---------- Activity ----------
const EVENTS = [
  { t: "08:43:02", kind: "ok",   src: "selfrepair", msg: "scheduled scan complete — 9 healthy / 2 warn / 1 fail" },
  { t: "08:42:17", kind: "ok",   src: "catalog",    msg: "synced manifests from github → +1 item, 11 unchanged" },
  { t: "08:38:55", kind: "warn", src: "observe",    msg: "regression flag: oracle.eval math_hard −0.8pp" },
  { t: "08:30:11", kind: "info", src: "generator",  msg: "publish PR #88 opened for apoc.research" },
  { t: "08:24:09", kind: "ok",   src: "homepilot",  msg: "v0.4.1 release notes signed by trinity" },
  { t: "08:18:30", kind: "info", src: "ollabridge", msg: "policy enforced: HF demo gated to 60 req/h" },
  { t: "08:10:48", kind: "ok",   src: "db",         msg: "Aiven PG nightly backup completed (184 MB)" },
  { t: "08:06:21", kind: "ok",   src: "audit",      msg: "trinity@admin: approved policy 'deny-expensive-route'" },
];

// ---------- IAM ----------
const PEOPLE = [
  { name: "trinity.morgan",  email: "trinity@matrixhub.io",  role: "OWNER",      mfa: true,  scopes: ["*"],                       last: "now" },
  { name: "neo.anderson",    email: "neo@matrixhub.io",      role: "ADMIN",      mfa: true,  scopes: ["infra:*","agents:*"],      last: "2m ago" },
  { name: "morpheus.lee",    email: "morpheus@matrixhub.io", role: "ADMIN",      mfa: true,  scopes: ["catalog:*","selfrepair:*"],last: "1h ago" },
  { name: "tank.j",          email: "tank@matrixhub.io",     role: "OPERATOR",   mfa: true,  scopes: ["deploy:write","logs:read"],last: "4h ago" },
];

// ---------- Policies ----------
const POLICIES = [
  { name: "deny-expensive-route",    status: "enforced", targets: 5,  updated: "2h ago",  author: "trinity", scope: "ollabridge" },
  { name: "require-mfa-admins",      status: "enforced", targets: 4,  updated: "4d ago",  author: "morpheus", scope: "iam" },
  { name: "generator-human-gated",   status: "enforced", targets: 6,  updated: "11d ago", author: "neo",     scope: "generator" },
  { name: "selfrepair-pr-required",  status: "enforced", targets: 12, updated: "11d ago", author: "trinity", scope: "selfrepair" },
  { name: "secrets-never-render",    status: "enforced", targets: 1,  updated: "30d ago", author: "trinity", scope: "ui" },
  { name: "redact-pii-on-prompts",   status: "audit",    targets: 12, updated: "1d ago",  author: "trinity", scope: "homepilot" },
];

// ---------- Admin links (Phase 6 seed for admin_links table) ----------
const LINKS = [
  { name: "Vercel — Frontend",         category: "deploy",   url: "https://vercel.com/agent-matrix",       desc: "matrixhub.io + admin.matrixhub.io" },
  { name: "OCI — API host",            category: "infra",    url: "https://cloud.oracle.com",              desc: "always-free ARM VM running MatrixHub API" },
  { name: "Aiven — PostgreSQL",        category: "data",     url: "https://console.aiven.io",              desc: "managed PG 16 · primary store" },
  { name: "GitHub — Catalog",          category: "catalog",  url: "https://github.com/agent-matrix/catalog",desc: "source of truth for manifests" },
  { name: "GitHub — SelfRepair",       category: "catalog",  url: "https://github.com/agent-matrix/selfrepair", desc: "health automation" },
  { name: "GitHub — Agent-Generator",  category: "catalog",  url: "https://github.com/agent-matrix/agent-generator", desc: "creation engine" },
  { name: "GitHub — HomePilot",        category: "runtime",  url: "https://github.com/agent-matrix/homepilot", desc: "local-first user runtime" },
  { name: "GitHub — OllaBridge",       category: "runtime",  url: "https://github.com/agent-matrix/ollabridge", desc: "inference router" },
  { name: "Hugging Face — Org",        category: "infer",    url: "https://huggingface.co/agent-matrix",   desc: "demo spaces · HF Pro off" },
  { name: "Cloudflare — DNS",          category: "network",  url: "https://dash.cloudflare.com",           desc: "DNS only · free plan" },
  { name: "Status page",               category: "observe",  url: "https://status.matrixhub.io",           desc: "public uptime" },
  { name: "Docs",                      category: "docs",     url: "https://docs.matrixhub.io",             desc: "developer + operator docs" },
];

// ---------- Session (mock; in real app comes from /api/auth/session) ----------
const SESSION = {
  user: {
    id: "usr_trinity",
    initials: "TM",
    displayName: "trinity.morgan",
    email: "trinity@matrixhub.io",
    role: "OWNER",
    tenant: "agent-matrix",
  },
  environment: { name: "ZION", stage: "PROD", region: "global" },
  expiresAt: "2026-05-26T12:00:00Z",
};

// expose on window for cross-file access
window.MATRIX_DATA = {
  NAV, KPIS, SERVICES, CATALOG, ALIVE, SELFREPAIR, GENERATOR, HOMEPILOT, OLLABRIDGE,
  DATABASE, ENV_SECRETS, COSTS, EVENTS, PEOPLE, POLICIES, LINKS, SESSION,
};
