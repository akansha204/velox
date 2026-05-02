# Velox

Velox is a small deployment pipeline dashboard. It accepts a Git repository URL, clones the project, builds it with Railpack through BuildKit, starts the resulting Docker image, stores deployment state in SQLite, streams build logs over Server-Sent Events, and exposes running apps through a backend reverse proxy.

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Query
- Backend: Node.js, Express, TypeScript
- Storage: SQLite via `better-sqlite3`
- Build/runtime: Docker, BuildKit, Railpack
- Proxy: Caddy and `http-proxy-middleware`

## Project Structure

```text
.
├── backend
│   ├── src
│   │   ├── db
│   │   ├── routes
│   │   ├── services
│   │   └── workers
│   ├── caddy/Caddyfile
│   └── Dockerfile
├── frontend
│   └── src
└── docker-compose.yml
```

## How It Works

1. The frontend sends a repository URL to `POST /deployments`.
2. The backend creates a deployment record in SQLite.
3. A worker clones the repository into `backend/tmp/<deployment-id>`.
4. Railpack builds the cloned project using BuildKit.
5. Docker starts the built image on a random host port.
6. Logs are saved and streamed to the dashboard through `GET /deployments/:id/logs`.
7. A running deployment is available at `/deployments/:id`.

## Local Development

Start the backend stack:

```bash
docker compose up --build
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend expects the API proxy at:

```text
http://localhost:8080
```

You can override it with:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Validation

Frontend production build:

```bash
cd frontend
npm run build
```

Backend type check:

```bash
cd backend
npx tsc --noEmit
```

## Deployment Recommendation

Because Velox builds and runs Docker containers from user-provided Git repositories, deploy it to a VPS or VM where you control Docker, BuildKit, firewall rules, storage, and process supervision. Serverless platforms like vercel, netlify are not a good first target for this project because the backend needs Docker access.

Good first deployment target:

- Ubuntu VPS
- Docker Engine and Docker Compose plugin
- A domain or subdomain
- Caddy or Nginx in front of the backend
- Frontend deployed either on the same VPS as static files or separately on Vercel/Netlify

## VPS Deployment Checklist

1. Provision an Ubuntu VPS.
2. Point a domain or subdomain to the VPS IP address.
3. Install Docker and the Compose plugin.
4. Clone this repository onto the server.
5. Update the frontend environment:

```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

6. Build and deploy the frontend.
7. Update Caddy to listen on your real domain with HTTPS.
8. Start the backend stack:

```bash
docker compose up -d --build
```

9. Confirm the API responds:

```bash
curl https://your-api-domain.com/deployments
```

10. Open the frontend and create a test deployment using a public Git repository.


## Current API

Create a deployment:

```http
POST /deployments
Content-Type: application/json

{
  "repoUrl": "https://github.com/user/project.git"
}
```

List deployments:

```http
GET /deployments
```

Stream logs:

```http
GET /deployments/:id/logs
```

Open a running deployment:

```http
GET /deployments/:id
```
