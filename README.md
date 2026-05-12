# Velox

A learning-focused deployment platform implementation that explores containerized deployments, runtime detection, reverse proxying, and deployment orchestration.

Velox accepts a Git repository URL, clones the project, automatically detects its runtime using Railpack, builds it with BuildKit, starts the resulting Docker image, stores deployment state in SQLite, streams build logs in real-time over Server-Sent Events, and exposes running applications through a backend reverse proxy.

## Project Scope

Velox is designed as an **educational infrastructure project**, inspired by platforms like Vercel, Render, and Railway. It prioritizes understanding deployment internals rather than providing universal runtime support.

The project explores:

- Containerized deployments and image orchestration
- Automatic runtime detection using Railpack
- Reverse proxying with Caddy
- Dynamic container lifecycle management
- Server-Sent Events (SSE) for real-time log streaming
- Deployment state management with SQLite

The platform intentionally evolves incrementally. Runtime support is currently selective and not universal, reflecting the reality that not all Git repositories are directly deployable web services.

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Query
- Backend: Node.js, Express, TypeScript
- Storage: SQLite via `better-sqlite3`
- Build/runtime: Docker, BuildKit, Railpack
- Proxy: Caddy and `http-proxy-middleware`

## Current Deployment Support

The platform currently works best with backend HTTP services that follow conventional runtime patterns. These workloads are tested and expected to deploy successfully:

### Stable / Recommended

Velox has the most reliable support for:

- Node.js backend services (any HTTP framework)
- Express applications
- Fastify servers
- Hono services
- Conventional Go backend services exposing a `PORT` environment variable

These deployments work well because:

- They follow predictable runtime conventions
- Startup commands are easily inferred through dependency analysis
- They expose HTTP services directly without complex routing
- Railpack's automatic detection handles their build requirements reliably

**Example:** A standard Express app with a `package.json` will clone, build, start, and serve requests with minimal friction.

### Experimental / Partial Support

Frontend and full-stack deployments are currently experimental. They may build successfully but can encounter runtime issues:

Frontend frameworks:

- React/Vite applications
- Next.js applications
- Static frontend deployments

**Known Issues:**

- Asset routing problems (CSS, JavaScript, images may fail to load)
- Base path mismatches when served behind reverse proxy at `/deployments/:id`
- Single-page application (SPA) routing conflicts with proxy path rewriting
- Environment variables interpolated at build time rather than runtime
- Hot Module Replacement (HMR) incompatible with reverse proxy setup
- Static file serving may fail if build output structure doesn't match assumptions

**Why this happens:**

- Frontend deployments require careful static asset handling, which the current reverse proxy doesn't fully support
- Frontend frameworks often assume serving from a predictable domain root (`/`), not from a subpath like `/deployments/:id`
- Build-time environment variables cannot be changed after deployment

A frontend build may complete successfully but still fail to display correctly at runtime. Frontend support is actively evolving, but production use of frontend deployments is not recommended at this time.

### Not Reliably Supported Yet

The platform does not currently support:

- Rust services (requires Rust toolchain, not automatically installed)
- Python applications (requires Python environment and pip configuration)
- Java applications (requires JVM and build tools)
- Monorepos and workspaces (complex dependency resolution)
- SDK or tooling repositories (not standalone HTTP services)
- Multi-service architectures (requires container orchestration)
- Applications requiring custom runtime or explicit startup commands
- Databases or external service dependencies

**Why these aren't supported:**

- Not all Git repositories are deployable web applications
- Some ecosystems require explicit configuration or runtime setup
- Railpack's automatic detection works best for isolated, self-contained services
- Complex deployment scenarios require manual configuration beyond the platform's scope

If you attempt to deploy a repository that falls into these categories, the build may fail or the application may not start. Check the deployment logs for specific error details.

## Architecture

```mermaid
flowchart LR
  user[User Browser] --> frontend[React + Vite Frontend]
  frontend -->|REST API| caddy[Caddy Proxy]
  frontend -->|SSE Logs| caddy
  caddy --> backend[Express Backend]

  backend --> sqlite[(SQLite Database)]
  backend --> worker[Deployment Worker]
  worker -->|git clone| repo[Git Repository]
  worker -->|railpack build| buildkit[BuildKit]
  buildkit --> image[Docker Image]
  worker -->|docker run| app[Deployed App Container]

  caddy -->|/deployments/:id| backend
  backend -->|reverse proxy| app
```

## Project Structure

```text
.
├── backend
│   ├── src
│   │   ├── db
│   │   ├── routes
│   │   ├── services
│   │   ├── workers
│   │   └── config.ts
│   ├── caddy/
│   │   ├── Caddyfile.local
│   │   └── Caddyfile.production
│   └── Dockerfile
├── frontend
│   └── src
├── .env.example
├── .env.local
├── .env.production
├── docker-compose.yml
└── docker-compose.production.yml
```

## How It Works

1. The frontend sends a repository URL to `POST /deployments`.
2. The backend creates a deployment record in SQLite with a unique ID.
3. A worker process clones the repository into `backend/tmp/<deployment-id>`.
4. Railpack analyzes the cloned project to detect its runtime and framework.
5. Railpack generates a Dockerfile and BuildKit builds the image.
6. Docker starts the built image on a random ephemeral port (4000-4999).
7. Logs are streamed to the client in real-time via Server-Sent Events.
8. The backend returns a `liveUrl` for running deployments based on the active environment config.
9. The running deployment is accessible through the backend reverse proxy.
10. Expired deployment records and logs are automatically removed by the backend cleanup scheduler.

## Technical Notes

### Runtime Detection and Limitations

The platform relies on **Railpack** for automatic runtime detection. This works by:

- Analyzing `package.json`, `go.mod`, `requirements.txt`, and other dependency files
- Inferring the correct runtime environment and startup command
- Generating a Dockerfile without manual configuration

**Runtime detection works best with:**

- Standard project structures following language conventions
- Single-service applications with clear entry points
- Projects that don't require environment-specific configuration

**Runtime detection has limitations:**

- Non-standard project layouts may confuse the detection algorithm
- Complex build steps or preprocessing steps may not be captured
- Projects requiring external services (databases, caches, APIs) won't work without manual intervention
- Monorepos and SDK repositories are not properly handled
- Some frameworks require explicit configuration beyond what Railpack can infer

### Build Success vs. Runtime Success

A critical distinction in Velox:

**Successful Docker image build does not guarantee successful runtime execution.**

A build can succeed (image is created) but the application may still fail to:

- Start without errors
- Listen on the expected PORT
- Serve HTTP requests correctly
- Load configuration or connect to external services

Always check the **deployment logs** for detailed error information. Successful builds that fail at runtime will show error messages in the logs before marking the deployment as failed.

### Frontend Deployments

Frontend frameworks are significantly different from backend services:

- **Backend:** Stateless HTTP server listening on PORT, handling requests directly
- **Frontend:** Static files that must be served with correct MIME types and routing rules

The current proxy setup (`http-proxy-middleware`) works well for forwarding requests but does not handle:

- SPA routing (redirecting 404s to `index.html`)
- CSS/JS/image asset base paths when served from a subpath
- Cache busting and versioned assets
- Graceful error pages

These limitations mean frontend deployments often fail at runtime even if the build succeeds.

### Deployment Lifecycle

Each deployment:

1. **Pending**: Queued and waiting to start
2. **Building**: Cloning repository and building image with Railpack/BuildKit
3. **Deploying**: Starting container and waiting for HTTP server to be ready
4. **Running**: Application is serving requests at `/deployments/:id`
5. **Failed**: Build or runtime error occurred; check logs for details

Deployment history is ephemeral. Records and associated logs are automatically deleted after the configured TTL.

### Port Allocation and Container Networking

- Each deployment gets a random ephemeral port (4000-4999)
- Containers run with port mapping: `-p <random>:3000`
- All deployed apps are expected to listen on port 3000 inside the container
- Environment-specific values live in repo-level env files:
  - `.env.local` keeps localhost development defaults.
  - `.env.production` keeps production domain defaults and should be updated in Git before deploying.
  - `.env.example` documents every supported setting.
- `PUBLIC_API_BASE_URL`, `DEPLOYMENT_URL_MODE`, and `PUBLIC_DEPLOYMENT_BASE_DOMAIN` determine the public deployment URLs returned by the backend.
- `FRONTEND_ORIGIN` controls which frontend origin the backend allows through CORS.
- `DEPLOYMENT_TTL_DAYS` controls how long deployment history and logs are retained.
- `CLEANUP_INTERVAL_MS` controls how often the backend runs the automatic cleanup job.
- The `DEPLOYMENT_HOST` environment variable determines how the backend reaches deployment containers (defaults to `host.docker.internal` in Docker)

### Deployment State and Logs

- Deployment state is stored in SQLite.
- Logs are stored in SQLite and streamed to connected clients over Server-Sent Events.
- The backend keeps the most recent 1000 log rows per deployment.
- The backend automatically deletes deployment records and their logs after `DEPLOYMENT_TTL_DAYS`.
- Cleanup runs on backend startup, periodically every `CLEANUP_INTERVAL_MS`, and before deployment list/proxy/log reads.
- `DELETE /deployments/reset` clears all deployment records and deployment logs.
- Cleanup and reset remove database records and logs, but do not currently stop already-running Docker containers.

### Environment Files

Velox keeps environment-specific values at the repository root:

```text
.env.example      Documents supported variables
.env.local        Local localhost defaults
.env.production   Production domain configuration
```


The current production values are:

```env
PUBLIC_API_BASE_URL=https://api.velox.akanshatwt.me
VITE_API_BASE_URL=https://api.velox.akanshatwt.me
FRONTEND_ORIGIN=https://velox.akanshatwt.me
DEPLOYMENT_URL_MODE=path
API_DOMAIN=api.velox.akanshatwt.me
DEPLOYMENT_TTL_DAYS=5
CLEANUP_INTERVAL_MS=3600000
```

`DEPLOYMENT_URL_MODE=path` means running apps are exposed as:

```text
https://api.velox.akanshatwt.me/deployments/:deploymentId
```

If a wildcard deployment domain is added later, switch to `DEPLOYMENT_URL_MODE=subdomain` and set `PUBLIC_DEPLOYMENT_BASE_DOMAIN`.

## Known Limitations

- **No custom startup commands**: Applications must follow Railpack's inferred startup behavior
- **No environment variable configuration**: Build-time variables cannot be overridden after deployment
- **No persistent app storage**: Deployed applications do not get managed persistent volumes or databases
- **No automatic container cleanup**: Expired records and logs are pruned, but running containers and built images are not automatically removed
- **Single-port model**: Applications must expose HTTP on a single port (typically 3000)
- **No SSL per deployment**: All deployments are accessed through the single Caddy proxy
- **No autoscaling**: Each deployment runs a single container instance
- **Limited monorepo support**: Multi-package workspaces are not reliably handled
- **Frontend proxy limitations**: SPAs and complex routing patterns don't work well

## Future Improvements

Possible enhancements to the platform:

- Smarter runtime detection for edge cases and complex projects
- Environment variable configuration at deployment time
- Custom startup command support for applications with non-standard requirements
- Improved frontend/static asset serving with SPA routing
- Deployment subdomain routing (e.g., `<deployment-id>.deployments.local`)
- Better monorepo and workspace handling
- Persistent volume support for databases and caches
- Container and built-image cleanup jobs
- Deployment logs retention and archival beyond the current 5-day TTL and 1000-line cap
- Performance monitoring and error tracking
- Webhook support for CI/CD integration

## Local Development

### Backend Setup

Start the Docker Compose stack (database, reverse proxy, BuildKit, Express backend):

```bash
docker compose up --build
```

The default Compose stack loads `.env.local`, uses `backend/caddy/Caddyfile.local`, and keeps deployments available through path-based localhost URLs.

The backend will run on `http://localhost:3001` and be accessible through Caddy at `http://localhost:8080/deployments`.

### Frontend Setup

In a separate terminal, start the React development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will open at `http://localhost:5173` and use `VITE_API_BASE_URL` from the repo-level `.env.local` by default.

To override the API base URL for one frontend run:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

### Testing Deployments Locally

When testing the platform, use repositories that are known to work with Railpack:

**Good test repositories:**

- Node.js with Express/Fastify/Hono
- Simple Go HTTP services with `go.mod`

**Avoid testing with:**

- Frontend-only repositories (experimental, likely to fail)
- Monorepos or multi-package workspaces (not supported)
- Repositories requiring environment variables or external services

To test a deployment:

1. Open `http://localhost:5173`
2. Paste a Git repository URL (e.g., a public Express example)
3. Watch the logs stream in real-time as the build progresses
4. Once deployed, click "Live" to view the running application
5. Check logs if the build or runtime fails

By default, local live links use `http://localhost:8080/deployments/:id`. This keeps local routing independent from production-only domains.

### Code Validation

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

## Deployment to a Server

### Prerequisites

Velox requires direct Docker and BuildKit access, making it unsuitable for serverless platforms. Deploy it to infrastructure you control:

**Suitable deployment targets:**

- Ubuntu VPS or VM
- Dedicated server with Docker support
- Private cloud environment (not serverless)
- Any Linux machine where you can install Docker and Docker Compose

**Not suitable for:**

- Vercel, Netlify (serverless, no Docker access)
- AWS Lambda, Google Cloud Functions (serverless)
- Shared hosting or cPanel-based hosting
- Platforms without Docker support

### Deployment Steps

1. **Provision infrastructure:**
   - Ubuntu 22.04+ VPS or VM
   - 2+ GB RAM, 20+ GB disk space
   - Root or sudoer access

2. **Install Docker and Compose:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   sudo apt install docker-compose-plugin
   ```

3. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/velox.git
   cd velox
   ```

4. **Review production environment values:**

   Production configuration lives in `.env.production`:

   ```env
   PUBLIC_API_BASE_URL=https://api.velox.akanshatwt.me
   VITE_API_BASE_URL=https://api.velox.akanshatwt.me
   FRONTEND_ORIGIN=https://velox.akanshatwt.me
   DEPLOYMENT_URL_MODE=path
   PUBLIC_DEPLOYMENT_BASE_DOMAIN=
   API_DOMAIN=api.velox.akanshatwt.me
   DEPLOYMENT_TTL_DAYS=5
   CLEANUP_INTERVAL_MS=3600000
   ```

   These values are intentionally represented in the repository so the EC2 deployment does not depend on undocumented manual edits.

5. **Review production proxy configuration:**

   Production Caddy routing lives in `backend/caddy/Caddyfile.production` and is mounted by `docker-compose.production.yml`.

6. **Start the backend stack:**
   ```bash
   docker compose \
     --env-file .env.production \
     -f docker-compose.yml \
     -f docker-compose.production.yml \
     up -d --build
   ```

7. **Build and deploy the frontend:**
   
   The frontend reads repo-level env files because `frontend/vite.config.ts` sets `envDir` to the repository root. Production builds use `VITE_API_BASE_URL=https://api.velox.akanshatwt.me`.

   Option A: Serve from the same VPS
   ```bash
   cd frontend
   npm run build
   npx serve -s dist -l 3000
   ```
   
   Option B: Deploy to a CDN or static hosting (Vercel, Netlify, etc.)
   - Build locally: `npm run build`
   - Deploy the `dist/` folder to your hosting provider
   - Point the frontend domain to `https://velox.akanshatwt.me`

8. **Verify the deployment:**
   ```bash
   # Check the API is responding
   curl https://api.velox.akanshatwt.me/deployments
   
   # Open the frontend in your browser
   # Test by deploying a simple Node.js or Go application
   ```

### Important Considerations

- **Storage:** Deployments and logs are stored in `database.db` in the backend container. Use Docker volumes for persistence if restarting containers.
- **Cleanup:** Deployment records and logs expire automatically after `DEPLOYMENT_TTL_DAYS`. Running containers and built images should still be monitored and cleaned up separately.
- **Security:** The platform accepts arbitrary Git URLs. Restrict access or run in a sandboxed environment.
- **Resource limits:** Each deployment runs in a separate container. Monitor disk usage as built images accumulate.

## CI/CD

The frontend is deployed by Vercel. Backend deployment is handled by GitHub Actions in `.github/workflows/deploy-backend.yml`.

The backend workflow does three things:

1. Runs a backend TypeScript check with `npx tsc --noEmit`.
2. SSHes into the EC2 machine.
3. Pulls the latest `master` branch and restarts the production Docker Compose stack.

The workflow runs automatically when backend or Compose files change on `master`. It can also be run manually from the GitHub Actions tab with `workflow_dispatch`.

### GitHub Secrets

Add these repository secrets in GitHub:

```text
EC2_HOST      EC2 public IP address or SSH hostname
EC2_USER      ubuntu
EC2_SSH_KEY   Private SSH key that can log into the EC2 instance
```

To create a dedicated deploy key from your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-velox" -f velox-actions-key
```

Add the public key to EC2:

```bash
cat velox-actions-key.pub | ssh ubuntu@<ec2-host> 'cat >> ~/.ssh/authorized_keys'
```

Add the private key contents to GitHub as `EC2_SSH_KEY`:

```bash
cat velox-actions-key
```

### EC2 Requirements

The workflow assumes:

- The repo exists at `/home/ubuntu/velox`.
- `.env.production` exists on EC2.
- Docker Compose works with `sudo docker compose`.
- The EC2 security group allows SSH, HTTP, and HTTPS as needed.

On deployment, the workflow runs:

```bash
git fetch origin master
git reset --hard origin/master

sudo docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  up -d --build
```

`git reset --hard origin/master` intentionally makes tracked files on EC2 match GitHub. Keep production-only values in `.env.production`, not in manually edited tracked files.

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

Running deployments include a `liveUrl` generated by the backend:

```json
{
  "id": "deployment-id",
  "repoUrl": "https://github.com/user/project.git",
  "status": "running",
  "imageTag": "image-id",
  "port": 4321,
  "createdAt": 1710000000000,
  "liveUrl": "https://api.velox.akanshatwt.me/deployments/deployment-id"
}
```

Stream logs:

```http
GET /deployments/:id/logs
```

Open a running deployment:

```http
GET /deployments/:id
```

Reset deployment records and logs:

```http
DELETE /deployments/reset
```
