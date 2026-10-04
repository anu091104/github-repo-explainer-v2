# Repo Explainer — AI Dashboard

**Paste any public GitHub repository URL. Get a dashboard-style AI breakdown of its purpose, architecture, tech stack, folder structure, how to run it, and likely interview questions.**

React + TypeScript + shadcn/ui on the frontend, FastAPI + Google Gemini on the backend.

> Live demo: https://github-repo-explainer-v2.vercel.app/
> API: https://github-repo-explainer-v2.onrender.com

## How it works

```
Browser (React on Vercel)
   │  POST /analyze { url }
   ▼
FastAPI backend (Render)
   ├─ utils.py       parse "github.com/owner/repo" → (owner, repo)
   ├─ github_api.py  3 parallel GitHub REST calls: repo info, README, top-level files
   ├─ gemini.py      one prompt → Gemini, forced to reply in a fixed JSON schema
   └─ main.py        returns { repo, readme, contents, analysis } (cached for 1 hour)
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (Vite), shadcn/ui (Radix + Tailwind), lucide-react, Axios |
| Backend | FastAPI, Uvicorn, httpx (async), Pydantic |
| AI | Google Gemini via the `google-genai` SDK with structured (schema-enforced) JSON output |
| Data source | GitHub REST API |
| Hosting | Vercel (frontend), Render (backend) |

## Project structure

```
backend/
├── main.py           # FastAPI app: routes, CORS, in-memory cache
├── github_api.py     # GitHub REST API calls (run in parallel)
├── gemini.py         # prompt + Gemini call + response schema
├── utils.py          # GitHub URL parsing/validation
├── requirements.txt
├── .python-version   # Python version for Render
└── .env.example
frontend/
├── src/
│   ├── App.tsx                 # page state: result / loading / error
│   ├── types/analysis.ts       # TypeScript types matching the backend response
│   ├── lib/api.ts              # calls the backend (analyze + health)
│   ├── lib/use-api-status.ts   # live "API Status" badge
│   ├── data/mock-data.ts       # example repos + sample data
│   └── components/             # ui/ (shadcn), layout/, analyze/
└── .env.example
render.yaml                     # Render blueprint for the backend
```

## Running locally (Windows / VS Code)

You need **Python 3.12+** (3.14 works) and **Node.js 20+**. Use two VS Code terminals.

### 1. Backend (terminal 1)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1          # if blocked: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env               # then put your GEMINI_API_KEY in .env
uvicorn main:app --reload --port 8000
```
Check http://localhost:8000/health and try the API at http://localhost:8000/docs.

### 2. Frontend (terminal 2)
```powershell
cd frontend
npm install
copy .env.example .env               # defaults to http://localhost:8000
npm run dev
```
Open http://localhost:5173.

## Deploying

**Backend → Render** (Web Service, or use `render.yaml` as a Blueprint)
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Environment variables: `GEMINI_API_KEY`, `GITHUB_TOKEN` (recommended), `ALLOWED_ORIGINS`

**Frontend → Vercel**
- Root directory: `frontend` (framework preset: Vite, auto-detected)
- Environment variable: `VITE_API_BASE_URL` = your Render URL, no trailing slash
- After the first deploy, add the Vercel URL to the backend's `ALLOWED_ORIGINS` on Render.

## Design decisions

- **Schema-enforced AI output** — the response shape is a Pydantic model passed to Gemini as `response_schema` and validated again server-side, so the UI never receives malformed data.
- **Parallel I/O** — the three GitHub requests run concurrently with `asyncio.gather`, and the Gemini call uses the SDK's async client, so one slow request doesn't block the server.
- **Caching** — repeated analyses of the same repo within an hour are served from memory, saving GitHub and Gemini quota.
- **Clear errors** — GitHub 404 / rate-limit and Gemini model / quota / key problems each produce a specific message with the right HTTP status.
- **Configurable model** — `GEMINI_MODEL` env var, so a Google model retirement is fixed from the hosting dashboard without a code change.
- **Cold-start friendly** — the frontend pings `/health` on page load (real status badge + wakes a sleeping free-tier server) and explains long waits.

## License

MIT
