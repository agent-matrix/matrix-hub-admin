// Matrix Cloud Admin — navigation + honest mock data.
// Real backend wiring comes in follow-up PRs; this gives the shell
// a stable typed contract today.

export type NavBadge = { kind: "ok" | "warn" | "err"; text: string };
export type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  path: string;
  badge?: NavBadge;
};
export type NavGroup = { group: string; items: NavItem[] };

export type IconName =
  | "grid" | "bot" | "server" | "catalog" | "rocket" | "db" | "disk"
  | "wave" | "book" | "heart" | "terminal" | "trace" | "metric"
  | "users" | "key" | "shield" | "scroll" | "coin" | "cog" | "chat"
  | "plus" | "refresh" | "chevron" | "search" | "bell" | "download"
  | "upload" | "play" | "pause" | "stop" | "dots" | "copy" | "eye"
  | "eyeOff" | "x" | "check" | "lock" | "branch" | "pulse" | "map"
  | "cube" | "tag" | "filter";

// Sidebar nav — Matrix Cloud groups + existing v1.4.2 view routes.
export const NAV: NavGroup[] = [
  {
    group: "Mission",
    items: [
      { id: "overview",  label: "Mission Control", icon: "grid",   path: "/" },
      { id: "alive",     label: "Alive Loop",      icon: "pulse",  path: "/alive-loop", badge: { kind: "ok", text: "live" } },
      { id: "links",     label: "Links",           icon: "branch", path: "/links" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { id: "catalog",   label: "Catalog",          icon: "catalog", path: "/catalog" },
      { id: "agents",    label: "Agents",           icon: "bot",     path: "/agents" },
      { id: "remotes",   label: "Remotes",          icon: "branch",  path: "/remotes" },
      { id: "generator", label: "Agent-Generator",  icon: "rocket",  path: "/agent-generator", badge: { kind: "warn", text: "2 PR" } },
      { id: "selfrepair",label: "SelfRepair",       icon: "heart",   path: "/selfrepair",      badge: { kind: "warn", text: "!" } },
    ],
  },
  {
    group: "Runtime",
    items: [
      { id: "homepilot",      label: "HomePilot",      icon: "cube",   path: "/homepilot" },
      { id: "ollabridge",     label: "OllaBridge",     icon: "wave",   path: "/ollabridge" },
      { id: "gateway",        label: "Gateway",        icon: "trace",  path: "/gateway" },
      { id: "infrastructure", label: "Infrastructure", icon: "server", path: "/infrastructure" },
      { id: "database",       label: "Database",       icon: "db",     path: "/database" },
      { id: "entities",       label: "Entities",       icon: "disk",   path: "/entities" },
    ],
  },
  {
    group: "Observe",
    items: [
      { id: "health", label: "Health & SLO", icon: "heart",    path: "/health" },
      { id: "logs",   label: "Live Logs",    icon: "terminal", path: "/logs" },
    ],
  },
  {
    group: "Govern",
    items: [
      { id: "iam",      label: "IAM & Roles",    icon: "users",  path: "/iam" },
      { id: "secrets",  label: "Env & Secrets",  icon: "key",    path: "/secrets" },
      { id: "policies", label: "Policies",       icon: "shield", path: "/policies" },
      { id: "audit",    label: "Audit Trail",    icon: "scroll", path: "/audit" },
    ],
  },
  {
    group: "Admin",
    items: [
      { id: "costs",    label: "Costs & Budget", icon: "coin", path: "/costs" },
      { id: "settings", label: "Settings",       icon: "cog",  path: "/settings" },
      { id: "support",  label: "Support",        icon: "chat", path: "/support" },
    ],
  },
];

// Flat lookup for breadcrumb/title resolution from the current path.
export function navLookup(path: string): NavItem | undefined {
  for (const g of NAV) {
    for (const it of g.items) {
      if (it.path === path) return it;
    }
  }
  return undefined;
}

// Honest service registry — the same set the static prototype uses,
// but typed so the shell + Mission Control can render without
// `any`.
export type ServiceStatus = "ok" | "warn" | "err" | "unknown";
export interface Service {
  id: string;
  name: string;
  category: string;
  provider: string;
  url: string;
  admin: string;
  status: ServiceStatus;
  configured: boolean;
  notes: string;
}

export const SERVICES: Service[] = [
  { id: "matrixhub_frontend", name: "MatrixHub Frontend", category: "Frontend", provider: "Vercel", url: "https://matrixhub.io", admin: "https://vercel.com", status: "ok", configured: true, notes: "Next.js · Free tier" },
  { id: "matrixhub_admin",    name: "Matrix Cloud Admin", category: "Frontend", provider: "Vercel", url: "https://admin.matrixhub.io", admin: "https://vercel.com", status: "ok", configured: true, notes: "this app" },
  { id: "matrixhub_api",      name: "MatrixHub API",      category: "API",      provider: "OCI Always-Free", url: "https://api.matrixhub.io", admin: "https://cloud.oracle.com", status: "ok", configured: true, notes: "FastAPI · 1× ARM micro" },
  { id: "aiven_postgres",     name: "PostgreSQL",         category: "Data",     provider: "Aiven", url: "—", admin: "https://console.aiven.io", status: "ok", configured: true, notes: "managed PG 17 · SSL" },
  { id: "catalog",            name: "Catalog Repo",       category: "Catalog",  provider: "GitHub", url: "https://github.com/agent-matrix/catalog", admin: "https://github.com/agent-matrix/catalog", status: "ok", configured: true, notes: "manifests · source of truth" },
  { id: "selfrepair",         name: "SelfRepair",         category: "Automation", provider: "GitHub Actions", url: "https://github.com/agent-matrix/selfrepair", admin: "https://github.com/agent-matrix/selfrepair/actions", status: "warn", configured: true, notes: "3 open issues" },
  { id: "agent_generator",    name: "Agent-Generator",    category: "Automation", provider: "GitHub Actions", url: "https://github.com/agent-matrix/agent-generator", admin: "https://github.com/agent-matrix/agent-generator/actions", status: "ok", configured: true, notes: "human-gated runs" },
  { id: "homepilot",          name: "HomePilot",          category: "Runtime",  provider: "Local app", url: "https://github.com/agent-matrix/homepilot", admin: "https://github.com/agent-matrix/homepilot/releases", status: "ok", configured: true, notes: "local-first runtime" },
  { id: "ollabridge",         name: "OllaBridge",         category: "Inference", provider: "Local / HF", url: "https://github.com/agent-matrix/ollabridge", admin: "https://huggingface.co/agent-matrix", status: "ok", configured: true, notes: "local → user key → HF" },
  { id: "cloudflare",         name: "DNS / Edge",         category: "Network",  provider: "Cloudflare", url: "—", admin: "https://dash.cloudflare.com", status: "ok", configured: true, notes: "DNS only · Free" },
];

// Alive loop snapshot.
export type AliveStatus = "ok" | "warn" | "err";
export interface AliveStep {
  step: number;
  key: string;
  title: string;
  sub: string;
  status: AliveStatus;
  last: string;
  detail: string;
}

export const ALIVE: AliveStep[] = [
  { step: 1, key: "discover",  title: "Discover",  sub: "scan catalog repo for new manifests",      status: "ok",   last: "08:42 UTC", detail: "12 manifests · 1 new since last scan" },
  { step: 2, key: "validate",  title: "Validate",  sub: "schema · permissions · runtime compat",    status: "ok",   last: "08:42 UTC", detail: "11 valid · 1 invalid" },
  { step: 3, key: "install",   title: "Install",   sub: "index in MatrixHub · update PG",           status: "ok",   last: "08:43 UTC", detail: "indexed in 1.2s" },
  { step: 4, key: "run",       title: "Run",       sub: "HomePilot loads persona+agent locally",    status: "ok",   last: "—",         detail: "local-first · no central inference" },
  { step: 5, key: "observe",   title: "Observe",   sub: "telemetry · errors · regressions",         status: "warn", last: "08:38 UTC", detail: "1 agent flagged: oracle.eval regression" },
  { step: 6, key: "repair",    title: "Repair",    sub: "SelfRepair scan · open issues + PRs",      status: "warn", last: "03:00 UTC", detail: "3 issues open · next scan in 7h" },
  { step: 7, key: "republish", title: "Republish", sub: "Agent-Generator publishes fix PRs",        status: "ok",   last: "yesterday", detail: "2 PRs pending review" },
  { step: 8, key: "learn",     title: "Learn",     sub: "feedback into prompts/policies/templates", status: "ok",   last: "weekly",    detail: "next learning cycle Sun 02:00 UTC" },
];

// Default session shape — eventually populated from /api/auth/session.
export const FALLBACK_SESSION = {
  user: {
    initials: "TM",
    displayName: "trinity.morgan",
    email: "trinity@matrixhub.io",
    role: "OWNER",
    tenant: "agent-matrix",
  },
  environment: { name: "ZION", stage: "PROD" },
};
