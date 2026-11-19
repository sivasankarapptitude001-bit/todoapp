# Todo Application

A modular todo application built with React, TypeScript, Express, Sequelize, and PostgreSQL.

## Project structure

- `todo-backend/` - Express REST API
- `todo-frontend/` - React and Vite client
- `docker-compose.yml` - Local PostgreSQL database

## Prerequisites

- Node.js 20 or newer
- npm
- Docker with Docker Compose

## Start the database

```bash
docker compose up -d postgres
```

## Start the backend

```bash
cd todo-backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

The API listens at `http://localhost:3000`. Check `GET /health`.

## Start the frontend

```bash
cd todo-frontend
cp .env.example .env
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`.

## Deploy on Railway

This repository deploys as three Railway services: PostgreSQL, the API, and the
frontend. The API and frontend Dockerfiles are in their respective directories.

1. Create a Railway project and add a PostgreSQL service.
2. Add an API service connected to this repository. Set its **Root Directory**
   to `/todo-backend`. Add these variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` to a securely generated value of at least 32 characters.
3. Deploy the API, then generate its public domain in **Settings → Networking**.
   The API image runs database migrations before starting the server.
4. Add a frontend service connected to the same repository. Set its **Root
   Directory** to `/todo-frontend` and add this variable:
   - `VITE_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api/v1`
5. Deploy the frontend, then generate its public domain. Set this variable on
   the API service and redeploy it:
   - `FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}`

Name the services `Postgres`, `backend`, and `frontend` as shown, or update the
Railway variable references to match your service names. `PORT` is assigned by
Railway; the API and frontend listen on it. The frontend API URL is embedded
during its Docker build, so changing it requires a new deployment.

After deployment, verify `https://<backend-domain>/health` reports a healthy
database, then open the frontend's Railway domain.