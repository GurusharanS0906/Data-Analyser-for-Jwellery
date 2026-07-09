# Jewellery AI Analytics

AI-powered customer analytics for jewellery retailers. Upload a customer Excel sheet, ask questions in plain English, and get instant, boardroom-ready insights — no SQL, no analysts, no waiting.

> **Status: Complete** — all 8 phases shipped (see [Roadmap](#roadmap) below). The full stack builds and runs in Docker, verified end-to-end.

## Architecture

This is a two-service monorepo:

```
Jwell AI/
├── frontend/     Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + shadcn/ui
├── backend/      Python FastAPI + Pandas + DuckDB + Claude (LangChain)
└── docker-compose.yml   Postgres + Redis for local development
```

**Why two services?** The frontend owns auth, the dashboard UI, and app metadata (users, uploads, chat history) via Prisma + PostgreSQL. The backend owns the heavy lifting: parsing Excel with Pandas, querying it locally with DuckDB, and turning natural-language questions into SQL via Claude — without ever sending your full dataset to the AI model.

### How a question gets answered

1. Pandas reads the uploaded Excel/CSV into a DataFrame.
2. The DataFrame is loaded into DuckDB (in-process, no external DB round-trip).
3. Claude receives the **table schema + a few sample rows + the user's question** — never the full dataset — and returns SQL.
4. DuckDB executes that SQL locally against the full data.
5. Only the **query result** (a small, bounded summary) is sent back to Claude to generate the natural-language answer and, optionally, a chart spec.

This keeps queries fast, cheap, and within token limits even for 200,000+ row spreadsheets, and the user never sees raw SQL.

### How a file gets uploaded

The browser uploads **directly to FastAPI**, bypassing Next.js entirely for the file bytes:

1. The client asks `GET /api/uploads/token` — a Next.js route that checks the session via `auth()` and mints a short-lived (15 min) HS256 JWT scoped to that user.
2. The browser XHRs the file straight to `POST {NEXT_PUBLIC_API_URL}/api/v1/uploads` with that token as a bearer header, so a real byte-level progress bar works and a 100MB file never has to pass through a Node process. (Vercel's serverless functions cap request bodies around 4.5MB — proxying uploads through Next.js would silently break at that size.)
3. FastAPI validates the token, streams the file to disk, reads it with Pandas, and returns a preview plus a data-quality report (missing values, duplicate rows, empty rows, inconsistent date/currency formatting).
4. The user reviews the report and chooses **Clean My Data** or **Skip & Use As-Is** — nothing is modified without that choice. Cleaning is re-computed on demand from the original file (nothing cached mid-flight), so it's safe to preview repeatedly.
5. On save, FastAPI materializes the final DataFrame into a DuckDB file (`storage/processed/{userId}/{fileId}.duckdb`) — the artifact the AI Chat engine below opens — and the browser then calls `POST /api/uploads` on the Next.js side to record the metadata in Postgres via Prisma.

### How AI Chat works

Same direct-to-FastAPI pattern as uploads (bridge token, no Next.js proxy), but streamed:

1. The browser fetches a bridge token and POSTs the question straight to `{NEXT_PUBLIC_API_URL}/api/v1/chat/ask` with the DuckDB file's id, the question, and the last ~10 messages of conversation history (fetched from Postgres beforehand — FastAPI itself stays stateless per request).
2. FastAPI inspects the DuckDB table's schema and a few sample rows, and sends **schema + samples + question + history** to Claude asking for a single DuckDB `SELECT` query — never the underlying data.
3. The query runs read-only against DuckDB. If it errors, the error is fed back to Claude to fix, up to 2 retries; if it still fails, the user gets an honest "try rephrasing" message instead of a stack trace.
4. The query result (capped at 50 rows) goes back to Claude with the original question, and the natural-language answer streams back token-by-token — the SQL itself is never sent to the browser at any point, satisfying "never expose SQL to users" at the network level, not just in the UI.
5. Once the stream finishes, the browser persists both the question and the full answer to `ChatMessage` via Prisma, which is also what powers the session sidebar's chat history.

**To actually chat with your data**, set a real `ANTHROPIC_API_KEY` in `backend/.env` — without it, the chat UI works end-to-end but responds with a clear "AI Chat isn't configured yet" error instead of silently failing.

### How Charts work

Two separate paths — one AI-driven, one pure heuristics — feed the same rendering layer:

- **In AI Chat**, whether a query result becomes a chart, and which type, is decided by **plain Python, not another Claude call** (`app/services/chart_engine.py`): the shape of the result (a date column → line, one category + one metric → bar/pie depending on row count, two categorical dimensions → heatmap) already tells you the answer, so spending an LLM call on it would just add latency and cost for a deterministic decision. Saying "as a pie chart" or "bar graph" in the question overrides the default. The resulting spec rides back to the browser in an `X-Chart-Spec` response header (base64 JSON), sent *before* the streamed text body — never inline in the answer text — and gets persisted to `ChatMessage.chartConfig` alongside the message.
- **The Analytics page** runs zero LLM calls at all: `app/services/auto_analytics.py` inspects the DuckDB schema, picks text columns with a sane number of distinct values (2–20 — filters out both near-unique identifier columns and constant ones) and groups the first numeric column by them, plus a monthly trend if any column's *content* looks date-like (checked by shape, not just the DuckDB column type — our own cleaning step formats dates as ISO strings rather than a native `DATE` type, so a type-only check would miss them).
- **Color system**: a categorical palette anchored on the brand gold, validated with the `dataviz` skill's six-check script (fixed hue order, OKLCH lightness band, CVD separation ≥ 8, contrast) for both chart surfaces — see `src/lib/chart-colors.ts`. Single-series bar/line/area charts render solid gold rather than a rainbow, since color is only carrying "identity" once there's more than one series to tell apart; pie/donut slices and multi-series charts use the full 8-hue rotation. The heatmap is a plain CSS grid (Recharts has no built-in heatmap) shaded with a single-hue sequential gold ramp.

### How Reports work

Also LLM-free — the whole page is real DuckDB aggregates, so it works with no `ANTHROPIC_API_KEY` set:

- **Smart insights** (`app/services/insights_engine.py`) compute KPIs (total/average of a name-hinted "money" column) and business insights straight from DuckDB — the top and bottom performer per category ("Gold Bangles leads by Product … Gold Chain is the lowest"), the best cross-tab pairing ("Chennai performs best in Gold Bangles"), and the latest month-over-month change ("Amount increased 2%"). Each insight carries a `tone` (positive / attention / neutral) that drives its card color on the page.
- **Downloads** stream on demand from FastAPI (`app/services/report_builder.py`): a branded **PDF** (reportlab — KPI band, insights, and a data preview table), a two-sheet **Excel** (xlsxwriter — a formatted Summary sheet plus the full data), and a raw **CSV** (UTF-8 BOM so Excel opens ₹ correctly). One gotcha handled: reportlab's built-in Helvetica has no ₹ glyph, so the PDF path alone swaps ₹ → `Rs.` (the web UI and Excel keep ₹, both being UTF-8). Each download is recorded to the `Report` table via Prisma and surfaces in a **Recent Reports** list; the **Print** button uses a print-isolation stylesheet to drop the app chrome and print just the report.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Lucide, React Hook Form, Zod |
| Backend | FastAPI, Pandas, Openpyxl, DuckDB, LangChain, Claude API |
| Database | PostgreSQL (via Prisma), Redis (cache) |
| Auth | NextAuth v5 (Auth.js), JWT sessions, Google OAuth, email/password (bcrypt) |
| Charts | Recharts *(Phase 6)* |
| Storage | Local disk *(Phase 4)*, AWS S3-ready |
| Deployment | Docker, Vercel (frontend), Render/Railway (backend) |

## Prerequisites

- Node.js 20+ and npm
- Python 3.12+
- Docker Desktop (for Postgres + Redis)

## Getting Started

### 1. Start the database and cache

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5433` and Redis on `localhost:6380` (non-default ports — chosen to avoid colliding with any native Postgres/Redis already installed on your machine) with the credentials already wired into `frontend/.env`.

### 2. Frontend

```bash
cd frontend
npm install                  # already done if you're reading this after setup
cp .env.example .env         # if .env doesn't already exist — fill in real secrets
npx prisma migrate dev --name init   # creates tables in Postgres
npx prisma generate
npm run dev
```

Frontend runs at **http://localhost:3000**.

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows Git Bash; use venv\Scripts\activate.bat on cmd.exe
pip install -r requirements.txt
cp .env.example .env              # fill in a real ANTHROPIC_API_KEY to enable AI Chat
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000** — interactive API docs at `http://localhost:8000/docs`.

## Environment Variables

### `frontend/.env`

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (matches `docker-compose.yml`) |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth session config — `NEXTAUTH_URL` must match the origin you actually serve on |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth — see [Setting up Google OAuth](#setting-up-google-oauth) below |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend |
| `BACKEND_JWT_SECRET` | Must match backend's `JWT_SECRET_KEY` — signs the short-lived token that lets the browser upload directly to FastAPI |

### Setting up Google OAuth

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 Client ID (Web application).
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (swap the host for your deployed domain in production).
3. Copy the Client ID/Secret into `frontend/.env`.

Without these set, the "Continue with Google" button will show a provider configuration error — email/password login works regardless.

### How auth works here

- **Sessions** are JWT-based (no server-side session table lookups). "Remember me" checked = 30-day session; unchecked = the JWT is minted with a 1-day expiry instead.
- **Passwords** are hashed with bcrypt (12 rounds) via `src/lib/password.ts`, never stored or logged in plaintext.
- **Forgot password** issues a single-use token (`VerificationToken` table, 1-hour expiry) and currently logs the reset link to the server console (`src/lib/email.ts`) — swap that function for Resend/SMTP before going to production.
- **Route protection**: `src/middleware.ts` guards `/dashboard/**` and redirects signed-in users away from `/login`, `/signup`, etc. It uses an Edge-safe subset of the auth config (`src/lib/auth.config.ts`) since Prisma and bcrypt can't run on the Edge runtime — the full config with providers lives in `src/lib/auth.ts` for Node-only routes.

### `backend/.env`

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Shared Postgres instance (currently unused by FastAPI directly — Prisma on the frontend owns writes) |
| `REDIS_URL` | Reserved for query result caching (not yet wired up) |
| `JWT_SECRET_KEY` | Must match frontend's `BACKEND_JWT_SECRET` — validates the upload/chat bridge token |
| `ANTHROPIC_API_KEY` | **Required for AI Chat.** Without it, `/api/v1/chat/ask` returns a 503 with a clear message instead of crashing |
| `ANTHROPIC_MODEL` | Defaults to `claude-sonnet-5` |
| `MAX_UPLOAD_SIZE_MB` | Upload size limit (default 100MB), enforced while streaming to disk |
| `CORS_ORIGINS` | Defaults to `localhost:3000`–`3010` to cover whichever port Next.js dev picks — widen this for production |

## Project Structure

```
frontend/src/
├── app/
│   ├── (auth)/           login, signup, forgot-password, reset-password
│   ├── api/auth/         NextAuth handler + register/forgot/reset routes
│   ├── api/user/         Profile, settings, change-password routes
│   ├── api/uploads/      Bridge token + persist-after-confirm routes
│   ├── api/chat/         Chat session + message CRUD (Prisma-backed)
│   ├── api/reports/      Report history CRUD (Prisma-backed)
│   └── dashboard/        Protected app shell — overview, upload, chat, analytics, reports, settings, profile
├── components/
│   ├── ui/               shadcn/ui primitives
│   ├── landing/           Landing page sections
│   ├── auth/              Auth forms, password input, Google button
│   ├── charts/            Bar/pie/donut/line/area/heatmap views + the type-dispatching renderer
│   ├── dashboard/         Sidebar, topbar, stat cards, settings/profile forms, shared file selector
│   │   ├── upload/         Dropzone, progress card, preview table, cleaning summaries
│   │   ├── chat/           Message bubbles, markdown rendering, history sidebar
│   │   ├── analytics/      Auto-analytics panel
│   │   └── reports/        Insight cards, KPI/download bar, recent-reports list
│   └── shared/            Cross-cutting components (theme, providers)
├── constants/            Static content & config
├── schemas/              Zod validation schemas
├── types/                Shared TypeScript types
├── hooks/                use-is-dark (theme-aware chart coloring)
├── lib/                  Utilities (cn, Prisma client, auth config, password/email helpers,
│                         upload/chat/analytics/reports clients, chart color tokens)
└── middleware.ts         Edge-safe route protection

backend/app/
├── api/v1/               Versioned API routes (health, uploads, chat, analytics, reports)
├── core/                 Settings/config, bridge-token auth dependency
├── middleware/           Request context, rate limiting
├── schemas/              Pydantic request/response models
├── services/             Storage, Pandas analyzer, cleaning engine, DuckDB schema
│                         inspection, NL→SQL generation, streaming answer generation,
│                         heuristic chart-type engine, programmatic auto-analytics,
│                         insights engine, PDF/Excel/CSV report builder
└── utils/                Logging and shared helpers
```

## Testing

- **Frontend:** `cd frontend && npm run lint && npm run build`
- **Backend:** `cd backend && pytest` *(test suite grows with each phase)* — Claude calls are mocked in tests (see `tests/fakes.py`), so the suite runs without a real `ANTHROPIC_API_KEY`.

## Deployment

Two compose files: `docker-compose.yml` (dev — just Postgres + Redis) and
`docker-compose.prod.yml` (the full stack: Postgres, Redis, backend, frontend,
and a one-off migration job).

### Self-hosted (Docker, full stack)

```bash
cp .env.prod.example .env.prod          # then fill in real secrets
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Frontend → **http://localhost:3000**, backend → **http://localhost:8000**. The
`migrate` job applies Prisma migrations before the frontend starts; Postgres and
Redis are internal-only (not published). This exact flow is verified end-to-end
(signup → upload → DuckDB → report download) against the built images.

Two secrets **must match** or the browser→backend bridge calls fail:
`BACKEND_JWT_SECRET` (frontend, signs the token) = `JWT_SECRET_KEY` (backend,
validates it). Generate each with `openssl rand -base64 32`.

### Managed platforms

- **Frontend → Vercel:** import `frontend/` as the project root. `vercel.json`
  sets the build to `prisma generate && next build`. Set `DATABASE_URL`,
  `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `BACKEND_JWT_SECRET`, `NEXT_PUBLIC_API_URL`
  (your backend's public URL — it's baked in at build time, so redeploy if it
  changes), and the Google OAuth vars in the dashboard.
- **Backend → Render / Railway:** deploy `backend/Dockerfile`. On Render, the
  root `render.yaml` blueprint provisions Postgres + Redis + backend (+ optional
  frontend) in one shot; enter the `sync: false` secrets in the dashboard.
  Railway: point a service at `backend/Dockerfile` and add the same env vars.
- **Database / cache:** any managed Postgres (Render/Railway/Supabase/Neon) +
  managed Redis (Upstash/Render). Run `npx prisma migrate deploy` from `frontend/`
  against the production `DATABASE_URL` once (Vercel can do this in the build, or
  run it as a one-off job).

### Gotchas worth knowing (all handled in the configs here)

- `NEXT_PUBLIC_API_URL` is **inlined into the client bundle at build time**, so
  it's a Docker build arg, not a runtime env — change it and you must rebuild.
- The Next.js standalone image strips the Prisma CLI's dependencies, so
  migrations run from a dedicated `migrator` build stage that keeps full
  `node_modules`, not from the runtime image.
- The backend runs as a non-root user; its `storage/` volume is initialized
  writable so uploads persist without permission errors.
- `CORS_ORIGINS` accepts a plain comma-separated string (not just JSON) — set it
  to your frontend's public origin(s).

## Roadmap

- [x] **Phase 1 — Project Setup**: Monorepo scaffold, luxury theme, landing page, Prisma schema, FastAPI skeleton, Docker Compose for Postgres/Redis.
- [x] **Phase 2 — Authentication**: Google + email/password login, JWT sessions with remember-me, forgot/reset password, protected `/dashboard` route via middleware.
- [x] **Phase 3 — Dashboard**: Collapsible sidebar (with "coming soon" state for unshipped features), top navbar (search UI, notifications, profile menu), overview cards, Recent Uploads/Questions (real Prisma queries, honest empty states), functional Settings and Profile pages.
- [x] **Phase 4 — Excel Upload**: Drag-and-drop upload direct to FastAPI (bridge-token auth, real progress bar, 100MB-safe), Pandas-based detection of missing values/duplicates/empty rows/inconsistent date & currency formats, preview table, opt-in cleaning with a before/after summary, DuckDB persistence, Remove/Replace file.
- [x] **Phase 5 — AI Engine**: Natural language → SQL via Claude (schema + samples only, never the full dataset), DuckDB execution with auto-retry on SQL errors, streaming markdown answers, ChatGPT-style UI with conversation memory, chat history, and a session-scoped file selector.
- [x] **Phase 6 — Charts**: Bar/pie/donut/line/area/heatmap components with a validated gold-anchored palette; AI Chat auto-attaches a chart to chartable answers (or honors an explicit "as a pie chart" request) via a fast heuristic — no extra LLM call; a new Analytics page auto-generates revenue/trend/share charts straight from the DuckDB schema, no question-asking required.
- [x] **Phase 7 — Reports**: A Reports page with programmatic KPIs and tone-coded smart insights (top/bottom performer per category, best cross-tab pairing, month-over-month change — all real DuckDB aggregates, no LLM call); downloadable branded PDF (reportlab), two-sheet Excel (xlsxwriter), and CSV; a Print button with a print-isolation stylesheet; and a Recent Reports history.
- [x] **Phase 8 — Deployment**: Multi-stage Dockerfiles for both apps (Next.js standalone + a dedicated Prisma migrator stage; non-root Python backend), a full-stack `docker-compose.prod.yml` (Postgres + Redis + backend + frontend + migration job), a Vercel config and a Render blueprint, and production env templates — the whole stack built and driven through a real signup → upload → report flow inside the containers.

Each phase shipped complete and error-free before the next began.
#   D a t a - A n a l y s e r - f o r - J w e l l e r y  
 