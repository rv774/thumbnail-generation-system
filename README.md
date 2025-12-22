# Thumbnail Generator

A full-stack application to generate thumbnails from uploaded videos.

## Architecture
- **Backend**: Node.js, Fastify, BullMQ (Redis), MongoDB
- **Worker**: Node.js, BullMQ, FFmpeg
- **Frontend**: Next.js, TailwindCSS, Socket.IO
- **Infrastructure**: Docker Compose

## Prerequisites
- Docker & Docker Compose
- Node.js (v18+) (for frontend local dev)

## How to Run

### 1. Start Backend & Infrastructure
The backend, worker, database, and queue are containerized.

```bash
# Start all backend services
docker compose up -d --build

# Check logs
docker compose logs -f
```

### 2. Start Frontend
The frontend runs locally for development.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

### 3. Access the App
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## Environment Variables
The backend uses `.env` (already configured for Docker defaults).
The frontend environment variables are in `frontend/.env.local`.
