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
