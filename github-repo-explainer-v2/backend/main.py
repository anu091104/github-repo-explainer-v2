"""
main.py
-------
FastAPI entry point - the "front door" of the backend.

Run locally (from the backend folder, with your venv active):
    uvicorn main:app --reload --port 8000
Then open http://localhost:8000/docs to try the API in your browser.

Request flow for POST /analyze:
    1. utils.parse_github_url   -> turn the pasted URL into (owner, repo)
    2. cache lookup             -> same repo analyzed recently? return that
    3. github_api               -> repo info + README + folder list (in parallel)
    4. gemini                   -> AI explanation as strict JSON
    5. return everything as one JSON response to the React frontend

Deployment (Render): start command is
    uvicorn main:app --host 0.0.0.0 --port $PORT
and ALLOWED_ORIGINS must contain your Vercel URL (comma-separated list).
"""

import os
import time

# Load backend/.env BEFORE importing our own modules, so every module
# sees the variables (on Render there is no .env; the dashboard sets them).
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import gemini  # noqa: E402
import github_api  # noqa: E402
from utils import parse_github_url  # noqa: E402

app = FastAPI(
    title="GitHub Repo Explainer API",
    description="Fetches a public GitHub repository and returns an AI-generated explanation of it.",
    version="2.1.0",
)

# --- CORS -----------------------------------------------------------------
# The browser only lets the frontend (e.g. https://my-app.vercel.app) call
# this backend if this backend says that origin is allowed.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
if _raw_origins.strip() == "*":
    allowed_origins = ["*"]
else:
    # strip spaces and trailing slashes - "https://x.vercel.app/" would never match
    allowed_origins = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# --- Tiny in-memory cache ------------------------------------------------
# Analyzing the same repo twice within an hour returns the saved answer
# instead of calling GitHub + Gemini again (faster, and saves free quota).
# It lives in RAM, so it is cleared whenever the server restarts.
CACHE_TTL_SECONDS = 60 * 60
CACHE_MAX_ENTRIES = 100
_cache: dict[str, tuple[float, dict]] = {}


def _cache_get(key: str) -> dict | None:
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL_SECONDS:
        return hit[1]
    _cache.pop(key, None)
    return None


def _cache_set(key: str, value: dict) -> None:
    if len(_cache) >= CACHE_MAX_ENTRIES:
        oldest = min(_cache, key=lambda k: _cache[k][0])
        _cache.pop(oldest, None)
    _cache[key] = (time.time(), value)


# --- Routes ---------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    url: str = Field(..., max_length=500, examples=["https://github.com/fastapi/fastapi"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "github-repo-explainer-api", "docs": "/docs"}


@app.get("/health")
async def health():
    """Used by the frontend's 'API Status' badge and by Render's health check."""
    return {
        "status": "healthy",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY", "").strip())
        and not os.getenv("GEMINI_API_KEY", "").startswith("your_"),
    }


@app.post("/analyze")
async def analyze_repository(request: AnalyzeRequest):
    owner, repo = parse_github_url(request.url)
    cache_key = f"{owner}/{repo}".lower()

    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        repo_info, readme, contents = await github_api.fetch_repo_bundle(owner, repo)
        analysis = await gemini.analyze_with_gemini(repo_info, readme, contents)
    except github_api.GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except gemini.GeminiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    result = {
        "repo": repo_info,
        "readme": readme,
        "contents": contents,
        "analysis": analysis,
    }
    _cache_set(cache_key, result)
    return result


if __name__ == "__main__":
    # Lets you also start the server with just `python main.py`.
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
