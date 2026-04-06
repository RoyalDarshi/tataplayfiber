# Tata Play Fiber Dashboard Suite

A responsive dashboard starter built with React on the frontend, Node.js on the backend, and PostgreSQL as the database. The sample data model follows the structure from your attached sheet:

- `Date`
- `Circle`
- `City`
- `Cluster`
- `Society`
- `Home_Passed`
- `Customer`
- `entity_ms`
- `Name`
- `Role`
- `KPI_Name`
- `Target`
- `FTD`
- `MTD`
- `LM`
- `LMTD`

## Project structure

- `frontend/` React + Vite dashboard UI
- `backend/` Node.js + Express API
- `backend/db/schema.sql` PostgreSQL schema
- `backend/src/scripts/seed.js` sample seed script

## Features

- Multiple dashboard views from a shared data model
- Responsive layout for desktop, tablet, and mobile
- Filter bar with circle, city, cluster, society, manager, role, KPI, and date range filters
- KPI cards, trend charts, leaderboards, and regional performance blocks
- PostgreSQL-ready schema aligned to your dataset
- Node.js aggregation API to power the React dashboards

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database:

```sql
CREATE DATABASE tata_play_fiber;
```

3. Copy env files:

- `backend/.env.example` to `backend/.env`
- `frontend/.env.example` to `frontend/.env`

Update `backend/.env` with your real PostgreSQL username, password, host, and database name if they are different from the sample:

```env
HOST=0.0.0.0
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/tata_play_fiber
```

4. Seed the sample data:

```bash
npm run db:seed
```

5. Start frontend and backend together:

```bash
npm run dev
```

## Run on network

- Frontend dev server runs on `0.0.0.0:5173`
- Backend server runs on `0.0.0.0:4000`
- Open the app from another device on the same network using:

```text
http://YOUR_SERVER_IP:5173
```

The Vite dev server proxies `/api` calls to the backend automatically.

## Offline bundle and server deployment

For an offline server, build the frontend once on a machine that has internet, then copy the prepared project to the target server.

1. On the connected machine:

```bash
npm install
npm run build
```

2. Make sure `backend/.env` is correct for the target server:

```env
HOST=0.0.0.0
PORT=4000
DATABASE_URL=postgresql://your_user:your_password@your_db_host:5432/tata_play_fiber
```

3. Copy these to the offline server:

- `backend/`
- `frontend/dist/`
- `package.json`
- `node_modules/`

4. On the offline server, start the Node app:

```bash
npm run start
```

After `npm run build`, the backend automatically serves the React build from `frontend/dist`, so in production or offline mode you only need the backend process and the built frontend files. Open:

```text
http://YOUR_SERVER_IP:4000
```

If the offline server cannot run `npm install`, prepare everything on a similar machine first and copy the ready-to-run project folder with `node_modules`.

## API endpoints

- `GET /api/health`
- `GET /api/dashboards`
- `GET /api/filters`
- `GET /api/dashboards/:dashboardId`

## Notes for real data

- The seed script is only a sample generator so the dashboards are immediately usable.
- You can replace `backend/src/data/sampleData.js` with CSV import logic from your production file whenever you're ready.
- The UI is designed so additional dashboards can be added by extending `backend/src/config/dashboardRegistry.js` and the frontend dashboard view switcher.
