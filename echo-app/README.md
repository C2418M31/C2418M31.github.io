# Network Intelligence Hub (echo-app)

Next.js rebuild of the static `echo.html` dashboard. AI-powered network analysis, natural-language
data queries, and a map chat assistant, backed by either Gemini or Claude.

## Structure

```
app/
  page.tsx              entry point, renders <Dashboard />
  layout.tsx            root HTML shell
  api/
    analyze/route.ts    POST -> AI analysis of a clicked user/area
    chat/route.ts        POST -> AI chat reply + optional map action
    query/route.ts        POST -> AI-parsed natural-language filter
components/
  dashboard/Dashboard.tsx  client-side orchestrator: owns state, wires map <-> sidebar <-> AI
  map/                     MapView (mapbox-gl wrapper) + MapLegend
  sidebar/                 DashboardControls, AnalysisPanel, QueryPanel, ChatPanel
  ui/                      small reusable primitives (Spinner, QualityBadge, ToggleGroup)
lib/
  ai/                      provider-agnostic AI layer
    types.ts               shared request/response contracts
    prompts.ts              prompt builders (single source of truth for both providers)
    schema.ts                zod validation for AI JSON output
    gemini.ts / claude.ts    provider implementations of the same AIProvider interface
    provider.ts              factory: reads AI_PROVIDER env var, returns the active provider
  geo/                     pure geo/data functions (scoring, choropleth grid, area stats)
  mapbox/                  map config + imperative layer setup (kept out of React components)
hooks/
  useNetworkData.ts        fetches + scores the geojson dataset
public/data/
  network_data.geojson     sample subscriber dataset
```

## Why a Next.js app instead of a static page

The AI calls need a server-side API key. GitHub Pages only serves static files, so this app is
meant to be deployed somewhere that runs Node (Vercel, etc.) — see the hosting note below.

## AI provider setup

Both Gemini and Claude can be configured at once; `AI_PROVIDER` just picks which one actually
serves requests. Switch providers by changing one env var, no code changes needed — both
implement the same `AIProvider` interface (`lib/ai/types.ts`).

1. Copy `.env.example` to `.env.local`.
2. Fill in whichever provider(s) you want:
   - Gemini: `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey)
   - Claude: `ANTHROPIC_API_KEY` (get one at https://console.anthropic.com/)
3. Set `AI_PROVIDER=gemini` or `AI_PROVIDER=claude`.
4. Set `NEXT_PUBLIC_MAPBOX_TOKEN` to your Mapbox public token.

## Prerequisites

Node.js 18.18+ (Node 20 LTS recommended) and npm. Verify with:

```bash
node -v
npm -v
```

<details>
<summary><strong>macOS</strong></summary>

Easiest path is [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart your terminal, then:
nvm install --lts
nvm use --lts
```

Or with Homebrew: `brew install node`.

</details>

<details>
<summary><strong>Windows</strong></summary>

Download the LTS installer from [nodejs.org](https://nodejs.org/) and run it — this installs
`node` and `npm` and adds them to PATH.

If you prefer version switching, use [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
instead:

```powershell
nvm install lts
nvm use lts
```

Run all commands below from **PowerShell** or **Command Prompt**. Git Bash also works. WSL2 with
a Linux Node install works too and behaves like the macOS/Linux instructions above.

</details>

## Run locally

`npm install` and `npm run dev` are identical on every OS — Next.js handles the platform
differences internally. Only the env file copy command differs:

**macOS / Linux**

```bash
cd echo-app
npm install
cp .env.example .env.local   # then fill in your keys, see "AI provider setup" above
npm run dev
```

**Windows (PowerShell or Command Prompt)**

```powershell
cd echo-app
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Uploading crowdsource data

The dashboard starts out showing the bundled sample at `public/data/network_data.geojson`. To
load your own data, it has to go through the upload page in the running app — **copying an
`.xlsx` file into the project folder does nothing by itself.**

1. With `npm run dev` running, open `http://localhost:3000/admin/upload` in your browser.
2. Click the file input and select your `.xlsx`/`.xls` file (any location on your computer —
   it isn't read from the project folder).
3. Click **Preview**. This only validates and shows you a row count / row-level errors; it does
   **not** save anything yet.
4. Click **Commit to live dataset**. This is the step that actually persists the data, to
   `.data/network-data.json` (gitignored — local to your machine, not part of the repo).
5. Reload `http://localhost:3000/` (the dashboard). It only fetches data once on load, so a tab
   that was already open before you committed won't update on its own.

Expected columns (case/spacing-insensitive): `latitude`, `longitude`, `signal_strength`,
`connection_type`, `timestamp`. Optional: `location_name`, `mobile_number`, `sim_slot`.

**Known limitation:** `.data/network-data.json` is a local file on disk. This works for local dev
and any traditional (non-serverless) host, but will **not** persist on serverless platforms with
ephemeral filesystems (e.g. Vercel's default runtime) — an upload there would appear to commit
successfully and then vanish on the next cold start. Swap `lib/data/store.ts` for a real database
before deploying the upload flow anywhere serverless.

### Generating a larger test dataset

`scripts/generate-seed-data.cjs` generates a synthetic `.xlsx` (nationwide spread, weighted
toward Luzon, ~90 days of timestamps) for exercising boundary drill-down and time-based features
without needing real crowdsource volume:

```bash
node scripts/generate-seed-data.cjs seed-network-data.xlsx
```

Then upload the resulting file through the steps above.

## Deploying

This app was intentionally left host-agnostic. Any Node-capable host works (Vercel is the
path of least resistance for Next.js — `vercel deploy` from this directory). Whatever you use,
set the same env vars from `.env.example` in that host's dashboard/secrets manager. Never expose
`GEMINI_API_KEY` or `ANTHROPIC_API_KEY` with a `NEXT_PUBLIC_` prefix — only the Mapbox token is
meant to be public.

## AI features

- **Network analysis** (`/api/analyze`): replaces the old hardcoded quality thresholds with a
  real AI read of the subscriber/area data, returning quality + a short summary + a
  recommendation.
- **Chat assistant** (`/api/chat`): free-form chat that can also emit a `flyTo`/`resetView`
  map action, which `Dashboard.tsx` executes against the live map instance.
- **Natural-language queries** (`/api/query`): turns requests like "show 4G users with poor
  signal" into a `{connectionTypes, minScore, maxScore}` filter applied to the map layers.
