.PHONY: db-up db-down backend frontend build run test

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

backend:
	cd backend && go run main.go

frontend:
	cd frontend && npm run dev

build:
	cd backend && go build -o kernel-backend ./...

install:
	cd frontend && npm install

run: db-up
	@echo "Starting backend and frontend..."
	@make -j2 backend frontend

test:
	cd backend && go test ./...
