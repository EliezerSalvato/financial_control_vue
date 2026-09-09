.DEFAULT_GOAL := help
PNPM := pnpm

.PHONY: help setup install dev build preview lint format type-check test test-unit test-watch test-e2e playwright-install

help:
	@echo "Available commands:"
	@echo "  make setup                 Install dependencies and create .env if missing"
	@echo "  make install               Install dependencies (pnpm)"
	@echo "  make dev                   Start the development server"
	@echo "  make build                 Type-check + production build"
	@echo "  make preview               Preview the production build"
	@echo "  make lint                  Run oxlint + eslint (with --fix)"
	@echo "  make format                Format src/ with Prettier"
	@echo "  make type-check            Type-check with vue-tsc"
	@echo "  make test / make test-unit Run unit tests once"
	@echo "  make test-watch            Run unit tests in watch mode"
	@echo "  make test-e2e              Run e2e tests (Playwright)"
	@echo "  make playwright-install    Install Playwright browsers"

setup: install
	@if [ ! -f .env ]; then cp .env.sample .env && echo "Created .env from .env.sample"; else echo ".env already exists"; fi

install:
	$(PNPM) install

dev:
	$(PNPM) dev

build:
	$(PNPM) build

preview:
	$(PNPM) preview

lint:
	$(PNPM) lint

format:
	$(PNPM) format

type-check:
	$(PNPM) type-check

test: test-unit

test-unit:
	$(PNPM) test:unit --run

test-watch:
	$(PNPM) test:unit

test-e2e:
	$(PNPM) test:e2e

playwright-install:
	$(PNPM) exec playwright install
