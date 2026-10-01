"""
gemini.py
---------
Builds one prompt from the repo's metadata + README + folder structure,
sends it to Google Gemini, and gets back a STRICT JSON object with a
fixed shape (purpose, architecture, tech_stack, ...).

How the "strict JSON" part works:
  We describe the answer shape as a Pydantic model (`RepoAnalysis`) and
  pass it to Gemini as `response_schema`. Gemini is then forced to reply
  with JSON that matches that schema, and we validate it again on our
  side before sending it to the frontend. So the frontend always gets
  the same keys, whatever repo is analyzed.

Uses the official `google-genai` SDK (the older `google-generativeai`
package is deprecated by Google). We use the SDK's async client
(`client.aio`) so a slow Gemini call does not block other requests.

The model name comes from the GEMINI_MODEL environment variable, so if
Google retires a model you only change an env var, not the code.
"""

import asyncio
import os

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

DEFAULT_MODEL = "gemini-flash-latest"


class RepoAnalysis(BaseModel):
    """The exact shape the frontend expects (see frontend/src/types/analysis.ts)."""

    purpose: str = Field(description="2-4 sentences: what the project does and who it is for.")
    architecture: str = Field(description="3-6 sentences: how the pieces of the project fit together.")
    tech_stack: list[str] = Field(description="One short string per language/framework/library.")
    how_to_run: list[str] = Field(description="Short ordered steps to run it locally.")
    interview_questions: list[str] = Field(description="5-8 realistic interview questions about this project.")
    improvements: list[str] = Field(description="3-6 concrete, specific possible improvements.")


_SYSTEM_INSTRUCTIONS = """You are a senior software engineer who explains unfamiliar \
codebases clearly and honestly to a beginner developer. You are given a repository's \
metadata, README, and top-level folder structure. You do not have access to every file, \
so you reason from what's provided and stay grounded in it -- you do not invent APIs, \
libraries, or claims the README doesn't support.

Fill in every field of the requested JSON schema. Keep language simple and concrete. \
Prefer specifics over generic filler."""


# Used automatically if the main model is overloaded / unavailable.
# Comma-separated; override with the GEMINI_FALLBACK_MODELS env var.
DEFAULT_FALLBACK_MODELS = "gemini-flash-lite-latest"
RETRIES_PER_MODEL = 1       # one extra try per model when Google is busy (HTTP 5xx)
RETRY_DELAY_SECONDS = 2


def _models_to_try() -> list[str]:
    """Main model first, then fallbacks, without duplicates. Read at call time."""
    main = os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
    fallbacks = os.getenv("GEMINI_FALLBACK_MODELS", DEFAULT_FALLBACK_MODELS)
    models = [main] + [m.strip() for m in fallbacks.split(",") if m.strip()]
    return list(dict.fromkeys(models))


class GeminiError(RuntimeError):
    """Raised for any Gemini problem. `status_code` is what our API returns."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _to_gemini_error(exc: "genai_errors.APIError", model_name: str) -> "GeminiError":
    """Turns Google's error into a short, human message + the right HTTP status."""
    if exc.code == 404:
        return GeminiError(
            f"Gemini model '{model_name}' was not found. Set GEMINI_MODEL to a current "
            "model name (see https://ai.google.dev/gemini-api/docs/models)."
        )
    if exc.code == 429:
        return GeminiError(
            "Gemini rate limit / free-tier quota reached. Wait a minute and try again.",
            status_code=429,
        )
    if exc.code in (400, 401, 403):
        return GeminiError(f"Gemini rejected the request - check that GEMINI_API_KEY is valid. ({exc.message})")
    if exc.code >= 500:
        return GeminiError(
            "Gemini is busy right now (Google's servers are overloaded). Please try again in a minute.",
            status_code=503,
        )
    return GeminiError(f"Gemini request failed: {exc.message}")


def _build_prompt(repo_info: dict, readme: str, contents: list[dict]) -> str:
    folder_lines = "\n".join(
        f"  {'[dir] ' if item['type'] == 'dir' else '[file]'} {item['name']}" for item in contents
    ) or "  (no top-level contents available)"

    return f"""Repository: {repo_info.get('full_name')}
Description: {repo_info.get('description') or '(none provided)'}
Primary language: {repo_info.get('language') or 'unknown'}
Topics: {', '.join(repo_info.get('topics') or []) or '(none)'}
Stars: {repo_info.get('stars')}  Forks: {repo_info.get('forks')}

Top-level folder structure:
{folder_lines}

README (may be truncated):
\"\"\"
{readme or '(no README found in this repository)'}
\"\"\"

Now analyze this repository."""


# One client per API key, created lazily and reused across requests.
_client: genai.Client | None = None
_client_key: str | None = None


def _get_client(api_key: str) -> genai.Client:
    global _client, _client_key
    if _client is None or _client_key != api_key:
        _client = genai.Client(api_key=api_key)
        _client_key = api_key
    return _client


async def _generate_with_fallback(client: genai.Client, prompt: str, config):
    """
    Try the main model first. If Google says it is busy (5xx), wait a moment
    and try once more. If it is still busy, out of quota (429) or unknown (404),
    move on to the fallback model. The user only sees an error if ALL fail.
    """
    last_error = GeminiError("Gemini request failed.")

    for model_name in _models_to_try():
        for attempt in range(1 + RETRIES_PER_MODEL):
            try:
                return await client.aio.models.generate_content(
                    model=model_name, contents=prompt, config=config
                )
            except genai_errors.APIError as exc:
                last_error = _to_gemini_error(exc, model_name)
                if exc.code in (400, 401, 403):
                    raise last_error from exc  # bad key/request: another model won't help
                is_busy = exc.code >= 500
                if is_busy and attempt < RETRIES_PER_MODEL:
                    await asyncio.sleep(RETRY_DELAY_SECONDS)
                    continue  # same model, one more time
                break  # next model
            except Exception as exc:  # network problems, timeouts, ...
                last_error = GeminiError(f"Could not reach Gemini: {exc}")
                break  # next model

    raise last_error


async def analyze_with_gemini(repo_info: dict, readme: str, contents: list[dict]) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your_"):
        raise GeminiError(
            "GEMINI_API_KEY is not set on the server. Add it to backend/.env "
            "locally, or to your hosting provider's environment variables in production.",
            status_code=500,
        )

    client = _get_client(api_key)
    prompt = _build_prompt(repo_info, readme, contents)
    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_INSTRUCTIONS,
        response_mime_type="application/json",
        response_schema=RepoAnalysis,
        temperature=0.4,
        # We don't give Gemini any tools, so switch this feature off (also silences a log warning).
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    response = await _generate_with_fallback(client, prompt, config)

    try:
        # response.text is the raw JSON string; validate it against our schema.
        analysis = RepoAnalysis.model_validate_json(response.text or "")
    except ValidationError as exc:
        raise GeminiError(f"Gemini returned an answer in an unexpected format: {exc}") from exc

    return analysis.model_dump()