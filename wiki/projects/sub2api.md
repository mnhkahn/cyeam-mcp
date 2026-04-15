---
title: Sub2API
type: projects
created: 2026-04-11
last_updated: 2026-04-11
related: ["[[API Security]]", "[[TOTP Authentication]]", "[[Development Tools]]"]
sources: ["8c678b638a69"]
---

# Sub2API

Sub2API is an open-source AI API gateway platform for centralizing and distributing API quotas across multiple AI services (Claude, Gemini, OpenAI, etc.). In April 2026, the subject deployed it on Fly.io using a zero-cost stack: Fly.io for compute, Neon for PostgreSQL, and Upstash for Redis.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Fly.io     │────▶│  Upstash    │────▶│   Neon      │
│  Sub2API    │     │   Redis     │     │  Postgres   │
│  256 MB RAM │     │  10k cmd/d  │     │  500 MB     │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Fly.io** runs the Sub2API container and exposes HTTP services.
- **Neon** provides serverless PostgreSQL for users, accounts, and usage data.
- **Upstash** provides serverless Redis for caching and queues.

## Deployment Steps

1. Register accounts on Fly.io, Neon, and Upstash.
2. In Neon, choose **Direct** connection (not Pooled) and copy the connection parameters.
3. In Upstash, copy the Redis endpoint and password.
4. Copy `.env.example` to `.env` and fill in the required values.
5. Run `./deploy/deploy.sh` to validate variables, set Fly Secrets, and deploy.

### Critical Environment Variables

```bash
# PostgreSQL (must use Direct connection)
DATABASE_HOST=xxx.cloud.neon.tech
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=xxx
DATABASE_DBNAME=neondb

# Redis
REDIS_HOST=xxx.upstash.io
REDIS_PASSWORD=xxx

# JWT secret must be fixed across restarts
JWT_SECRET=$(openssl rand -hex 32)

# TOTP encryption key (optional, for 2FA)
TOTP_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Admin account
ADMIN_EMAIL=your-email@example.com
```

## Common Pitfalls

### Neon Pooled Connection Causes SQL Errors

**Symptom:** HTTP 500 after login; logs show:
```
pq: bind message supplies 5 parameters, but prepared statement "" requires 2
```

**Cause:** Neon Pooled connections use PgBouncer, which does not support PostgreSQL prepared statements. Sub2API relies heavily on prepared statements.

**Fix:** Switch to Neon's **Direct** connection host (without `-pooler`).

### JWT Secret Not Fixed

**Symptom:** Login expires within seconds and redirects back to the login page.

**Cause:** If `JWT_SECRET` is missing or changes on each deployment, issued tokens become invalid immediately.

**Fix:** Set a fixed 64-character hex `JWT_SECRET` via `fly secrets set`.

### fly.toml Rewritten by Flyctl

**Symptom:** `memory` is increased to `1gb` and `max_machines_running` is set to 2, potentially exceeding free-tier limits.

**Fix:** Pin values explicitly:
```toml
[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1

[http_service]
  max_machines_running = 1
```

### Data Volume Requirement

**Symptom:** Deployment fails because a `sub2api_data` volume is expected.

**Fix:** If persistent file storage is not needed, comment out the `[[mounts]]` section in `fly.toml` and pass all configuration via environment variables.

### CORS and Proxy Issues

**Symptom:** Frontend API calls return 401 or CORS errors.

**Fix:** Set `force_https = true` in `fly.toml` and ensure `SERVER_MODE=release`.

## Operations

- View logs: `fly logs --app sub2api-flyio`
- Check status: `fly status --app sub2api-flyio`
- Back up Neon data regularly; the free tier does not include automatic backups.

## Free-Tier Limits

| Service | Limit |
|---|---|
| Fly.io | 256 MB RAM; sleeps when idle |
| Neon | 500 MB storage |
| Upstash | 10,000 commands per day |
