#!/usr/bin/env node
/* eslint-disable */
//
// scripts/test-admin-api.mjs
//
// Standalone smoke test for the matrix-hub-admin proxy routes. Pure
// Node, no dependencies, no test framework. Run against a running dev
// server:
//
//     npm run dev    # in another terminal
//     node scripts/test-admin-api.mjs
//
// Or against a deployed preview:
//
//     ADMIN_BASE=https://your-preview.vercel.app node scripts/test-admin-api.mjs
//
// Verifies each /api/hub/* proxy route forwards to the correct
// matrix-hub endpoint and returns 2xx. Would have caught the
// `/catalog/remotes` (which doesn't exist) -> 404 silent-fail bug
// immediately.

const ADMIN_BASE = process.env.ADMIN_BASE || "http://localhost:3000";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    process.stdout.write(`\x1b[32m✓\x1b[0m ${name}\n`);
    passed++;
  } catch (e) {
    process.stdout.write(`\x1b[31m✗ ${name}\x1b[0m\n`);
    process.stdout.write(`  \x1b[2m${e.message || e}\x1b[0m\n`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function fetchWithTimeout(url, init) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  process.stdout.write(`Smoke testing matrix-hub-admin at \x1b[1m${ADMIN_BASE}\x1b[0m\n\n`);

  // --- Public proxy routes ------------------------------------------------

  await check(`GET /api/hub/health -> Hub /health`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/health`);
    assert(r.ok, `HTTP ${r.status}`);
    const j = await r.json();
    assert(j && typeof j === "object", "non-object response");
  });

  await check(`GET /api/hub/catalog?limit=1 -> Hub /catalog…`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/catalog?limit=1`);
    assert(r.ok, `HTTP ${r.status}`);
    const j = await r.json();
    assert(Array.isArray(j.items), "items not array");
    assert(typeof j.total === "number", "total not number");
  });

  await check(`GET /api/hub/search?q=postgres -> Hub /catalog/search…`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/search?q=postgres&limit=5`);
    assert(r.ok, `HTTP ${r.status}`);
    const j = await r.json();
    assert(Array.isArray(j.items), "items not array");
  });

  await check(`GET /api/hub/remotes -> Hub /remotes (was /catalog/remotes)`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/remotes`);
    assert(r.ok, `HTTP ${r.status} — if 502 the proxy path is still wrong`);
    const j = await r.json();
    assert(
      typeof j === "object" && ("items" in j || "count" in j || Array.isArray(j)),
      "unexpected /remotes shape",
    );
  });

  await check(`GET /api/hub/gateways -> Hub /gateways/pending`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/gateways`);
    assert(r.ok, `HTTP ${r.status}`);
  });

  await check(`GET /api/hub/entity?id=<known> -> Hub /catalog/entities/<id>`, async () => {
    // Pull a known id first.
    const list = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/catalog?limit=1`).then((r) => r.json());
    const id = list.items?.[0]?.id;
    if (!id) {
      process.stdout.write(`  \x1b[2m(catalog empty, skipping)\x1b[0m\n`);
      return;
    }
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/entity?id=${encodeURIComponent(id)}`);
    assert(r.ok, `HTTP ${r.status}`);
    const j = await r.json();
    assert(j.id === id, `id mismatch: got ${j.id}, want ${id}`);
  });

  // --- 405 surface --------------------------------------------------------

  await check(`POST /api/hub/catalog returns 405`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/catalog`, { method: "POST" });
    assert(r.status === 405, `expected 405, got ${r.status}`);
  });

  // --- 400 surface for missing params ------------------------------------

  await check(`GET /api/hub/entity (no id) returns 400`, async () => {
    const r = await fetchWithTimeout(`${ADMIN_BASE}/api/hub/entity`);
    assert(r.status === 400, `expected 400, got ${r.status}`);
  });

  // --- Summary ------------------------------------------------------------

  process.stdout.write(`\n`);
  if (failed === 0) {
    process.stdout.write(`\x1b[32m\x1b[1m✓ ${passed} passed\x1b[0m\n`);
    process.exit(0);
  } else {
    process.stdout.write(
      `\x1b[31m\x1b[1m✗ ${failed} failed\x1b[0m, \x1b[32m${passed} passed\x1b[0m\n`,
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\x1b[31m\x1b[1mTest runner crashed:\x1b[0m", e);
  process.exit(2);
});
