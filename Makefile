.PHONY: help dev build start docker-build docker-run docker-stop docker-logs clean

APP_PORT ?= 3000
IMAGE ?= matrix-hub-admin:latest
CONTAINER ?= matrix-hub-admin

help:
	@echo "matrix-hub-admin (Next.js + Refine)"
	@echo "Commands:"
	@echo "  dev            Start dev server (next dev)"
	@echo "  build          Build production"
	@echo "  start          Run production locally"
	@echo "  docker-build   Build Docker image"
	@echo "  docker-run     Run image on port $(APP_PORT)"
	@echo "  docker-stop    Stop container"
	@echo "  docker-logs    Tail container logs"
	@echo "  clean          Remove node_modules and .next"

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm -d -p $(APP_PORT):3000 --name $(CONTAINER) --env-file .env.local $(IMAGE)

docker-stop:
	docker stop $(CONTAINER) || true

docker-logs:
	docker logs -f $(CONTAINER)

clean:
	rm -rf node_modules .next
