# AGENTS.md

Guidance for AI agents working in this repository.

## Cursor Cloud specific instructions

### Product

Single **Magno Terra API** service: Node.js 20+ / Express REST API with MySQL. No frontend in this repo. See `README.md` for endpoints and project layout.

### Dependencies

- **Package manager:** npm (`package-lock.json`). Install with `npm ci` (or `npm install`).
- **Node:** `>=20` (see `.nvmrc`).

### Environment variables

Copy `env.example` to `.env` before running the dev server or tests. `DATABASE_URL` is required (validated in `src/config/env.js` on import).

Local MariaDB example (matches `docker-compose.yml` intent):

```env
DATABASE_URL=mysql://root:password@localhost:3306/magnoterra
```

### Database (required for `npm run dev`)

`index.js` connects to MySQL on startup and exits if the DB is unreachable. Tests mock the pool but still need a valid `DATABASE_URL` in the environment.

**Docker Compose:** `docker-compose.yml` defines `api` + `mysql`, but `./docker/mysql/init.sql` is missing from the repo; the bind mount may create an empty directory if the path does not exist. MySQL still creates `magnoterra` via `MYSQL_DATABASE` when the container starts cleanly.

**Without Docker (typical Cloud Agent VM):** MariaDB can be started manually when systemd is unavailable:

```bash
sudo mkdir -p /run/mysqld && sudo chown mysql:mysql /run/mysqld
sudo mysqld_safe --datadir=/var/lib/mysql &
# First-time setup (adjust if root auth differs):
sudo mysql -e "CREATE DATABASE IF NOT EXISTS magnoterra; ALTER USER 'root'@'localhost' IDENTIFIED BY 'password'; FLUSH PRIVILEGES;"
```

### Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (nodemon → `index.js`, port 3000) |
| Production-style (no DB) | `npm start` → `start-railway.js` |
| Lint | `npm run lint` |
| Format | `npm run format` / `npm run format -- --check` |
| Test | `npm test` |
| Typecheck | `npm run typecheck` (stub for JS) |

Use a **tmux** session for long-running `npm run dev`.

### Gotchas

- **ESLint:** `npm run lint` may fail with flat-config migration error (`env` key in `eslint.config.js`). This is a known repo issue; CI runs the same command.
- **Vitest:** All tests can pass while Vitest reports an unhandled rejection if `index.js` is imported and the server fails to bind or connect to MySQL during the test run.
- **MySQL2:** Pool config may log warnings about deprecated options (`acquireTimeout`, `timeout`, `reconnect`).

### Hello-world verification

With API and DB running:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/db-check
curl http://localhost:3000/api
```

Expected: HTTP 200 on `/health`, JSON `[{"ok":1}]` on `/db-check` when the database is reachable.
