.PHONY: dev stop build test migrate seed logs clean setup

setup:
	cp .env.example .env
	npm install
	docker compose -f infra/docker/docker-compose.yml up -d db redis gitea
	@echo "Waiting for database..."
	@sleep 5
	npm run db:migrate
	npm run db:seed
	@echo "Setup complete. Run 'make dev' to start."

dev:
	docker compose -f infra/docker/docker-compose.yml up -d db redis gitea mailhog
	npm run dev

stop:
	docker compose -f infra/docker/docker-compose.yml stop

build:
	npm run build

test:
	npm run test

migrate:
	npm run db:migrate

seed:
	npm run db:seed

logs:
	docker compose -f infra/docker/docker-compose.yml logs -f

clean:
	docker compose -f infra/docker/docker-compose.yml down -v
	rm -rf node_modules apps/*/node_modules services/*/node_modules packages/*/node_modules
	@echo "Cleaned. Run 'make setup' to start fresh."

lint:
	npm run lint

typecheck:
	npm run typecheck
