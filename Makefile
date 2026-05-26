# matrix-hub-admin Makefile
#
#   make install   # one-time setup
#   make dev       # local development server
#   make test      # pre-deploy gate (typecheck + lint + api smoke)
#
# `make test` chains the gates so any failure stops the run with a
# clear error — no wall of follow-on output to wade through.

PKG_MANAGER ?= npm
NODE         := node

.PHONY: help
help:
	@echo "matrix-hub-admin — make targets:"
	@echo ""
	@echo "  Setup"
	@echo "    make install         Install npm dependencies"
	@echo ""
	@echo "  Development"
	@echo "    make dev             Start the Next.js dev server (http://localhost:3000)"
	@echo "    make build           Production build (next build)"
	@echo "    make start           Start the production server"
	@echo ""
	@echo "  Pre-deploy gate"
	@echo "    make test            Full check: typecheck + lint + api smoke + build"
	@echo "    make test-quick      Skip the build (typecheck + lint + api smoke)"
	@echo ""
	@echo "  Individual gates"
	@echo "    make test-types      TypeScript typecheck (tsc --noEmit)"
	@echo "    make test-lint       ESLint (next lint)"
	@echo "    make test-api        Smoke test against /api/hub/* proxy routes"
	@echo "                         (requires `make dev` running in another terminal)"
	@echo "    make test-build      Production build dry-run"
	@echo ""
	@echo "  Maintenance"
	@echo "    make clean           Remove .next and node_modules"

.PHONY: install
install:
	@echo "→ Installing dependencies..."
	$(PKG_MANAGER) install
	@echo "✓ Done. Copy .env.local.example to .env.local, then 'make dev'."

.PHONY: dev build start
dev:
	$(PKG_MANAGER) run dev

build:
	$(PKG_MANAGER) run build

start:
	$(PKG_MANAGER) start

.PHONY: test test-quick
test: test-types test-lint test-api test-build
	@echo ""
	@echo "\033[32m\033[1m✓ ALL CHECKS PASSED — ready to deploy.\033[0m"

test-quick: test-types test-lint test-api
	@echo ""
	@echo "\033[32m✓ Quick checks passed.\033[0m Run 'make test-build' before pushing."

.PHONY: test-types
test-types:
	@echo "\033[1m→ Step 1/4: TypeScript typecheck\033[0m"
	$(PKG_MANAGER) exec tsc --noEmit
	@echo "\033[32m  ✓ typecheck OK\033[0m"

.PHONY: test-lint
test-lint:
	@echo "\033[1m→ Step 2/4: ESLint\033[0m"
	$(PKG_MANAGER) run lint
	@echo "\033[32m  ✓ lint OK\033[0m"

.PHONY: test-api
test-api:
	@echo "\033[1m→ Step 3/4: Admin proxy smoke test\033[0m"
	@echo "  (requires dev server: 'make dev' in another terminal)"
	$(NODE) scripts/test-admin-api.mjs
	@echo "\033[32m  ✓ api smoke OK\033[0m"

.PHONY: test-build
test-build:
	@echo "\033[1m→ Step 4/4: Production build (next build)\033[0m"
	$(PKG_MANAGER) run build
	@echo "\033[32m  ✓ build OK\033[0m"

.PHONY: clean
clean:
	@echo "→ Removing .next and node_modules..."
	rm -rf .next node_modules
	@echo "✓ Clean. Run 'make install' to reinstall dependencies."
