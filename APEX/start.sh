#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[APEX]${NC} $1"; }
warn() { echo -e "${YELLOW}[APEX]${NC} $1"; }

# Create .env if missing
if [ ! -f .env ]; then
    cp .env.example .env
    log "Created .env from .env.example"
fi

# Start PostgreSQL
log "Starting PostgreSQL..."
docker compose up -d --wait 2>/dev/null || docker-compose up -d 2>/dev/null
log "PostgreSQL ready"

# Start Go backend
log "Starting backend on :8080..."
go run main.go &
BACKEND_PID=$!

# Wait for backend to be ready
for i in $(seq 1 30); do
    if curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1; then
        break
    fi
    sleep 1
done
log "Backend ready (PID $BACKEND_PID)"

# Start frontend
log "Starting frontend on :5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

log "================================================"
log "  APEX Exam Portal running!"
log "  Frontend: http://localhost:5173"
log "  Backend:  http://localhost:8080"
log "================================================"
warn "Press Ctrl+C to stop all services"

# Cleanup on exit
cleanup() {
    log "Shutting down..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null
    log "Done"
}
trap cleanup EXIT INT TERM

wait
