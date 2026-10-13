"""
github_api.py
-------------
Talks to GitHub's public REST API to get three things about a repo:
  1. metadata  (name, stars, forks, language, ...)  -> /repos/{owner}/{repo}
  2. README    (decoded from base64)                 -> /repos/{owner}/{repo}/readme
  3. top-level folder listing                        -> /repos/{owner}/{repo}/contents

`fetch_repo_bundle` runs all three requests AT THE SAME TIME
(asyncio.gather) instead of one after another, so the total wait is
roughly the slowest single call rather than the sum of all three.

Works for ANY public repository - owner/repo come from the user's URL.
"""

import asyncio
import base64
import logging
import os

import httpx

log = logging.getLogger("repo_explainer.github")

GITHUB_API_BASE = "https://api.github.com"
README_MAX_CHARS = 12000


class GitHubError(Exception):
    """Raised when GitHub itself refuses or fails. `status_code` is what our API returns."""

    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code


def _headers() -> dict:
    """
    A GITHUB_TOKEN is optional but strongly recommended in production:
    without it GitHub allows only 60 requests/hour PER SERVER IP (each
    analysis uses 3). With a token the limit is 5,000/hour.
    """
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-repo-explainer",
    }
    token = os.getenv("GITHUB_TOKEN")
    if token and not token.startswith("your_"):
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _token_is_set() -> bool:
    token = os.getenv("GITHUB_TOKEN", "")
    return bool(token.strip()) and not token.startswith("your_")


def _raise_if_rate_limited(response: httpx.Response) -> None:
    """
    Turns GitHub's auth / rate-limit refusals into clear messages.
    Note: GitHub's *secondary* rate limit is a 403 WITHOUT
    x-ratelimit-remaining == 0, so we can't rely on that header alone.
    """
    code = response.status_code
    if code not in (401, 403, 429):
        return

    remaining = response.headers.get("x-ratelimit-remaining")
    body = response.text[:300]
    log.warning(
        "GitHub %s on %s (remaining=%s, token_set=%s): %s",
        code, response.request.url.path, remaining, _token_is_set(), body,
    )

    if code == 401:
        raise GitHubError(
            "GitHub rejected the server's GITHUB_TOKEN (expired or invalid). "
            "Generate a new token and update it in the backend environment variables.",
            status_code=502,
        )
    if code == 429 or remaining == "0" or "rate limit" in body.lower():
        hint = (
            "Try again in a few minutes."
            if _token_is_set()
            else "The server has no GITHUB_TOKEN, so it shares a tiny anonymous quota. Add one."
        )
        raise GitHubError(f"GitHub API rate limit reached. {hint}", status_code=429)
    # other 403s: repo blocked (DMCA), access restricted, etc.
    raise GitHubError(f"GitHub refused access to this repository (403): {body}", status_code=502)


def _parse_repo_info(data: dict) -> dict:
    owner = data.get("owner") or {}
    return {
        "name": data.get("name"),
        "full_name": data.get("full_name"),
        "description": data.get("description"),
        "stars": data.get("stargazers_count", 0),
        "forks": data.get("forks_count", 0),
        "open_issues": data.get("open_issues_count", 0),
        "language": data.get("language"),
        "owner": owner.get("login"),
        "owner_avatar": owner.get("avatar_url"),
        "html_url": data.get("html_url"),
        "topics": data.get("topics", []),
        "default_branch": data.get("default_branch", "main"),
        "license": (data.get("license") or {}).get("name"),
        "created_at": data.get("created_at"),
        "updated_at": data.get("updated_at"),
    }


async def _get_repo_info(client: httpx.AsyncClient, owner: str, repo: str) -> dict:
    response = await client.get(f"/repos/{owner}/{repo}")
    _raise_if_rate_limited(response)
    if response.status_code == 404:
        raise GitHubError(
            f"Repository '{owner}/{repo}' wasn't found. Check the URL and make sure it's public.",
            status_code=404,
        )
    if response.status_code != 200:
        log.warning("GitHub %s for %s/%s: %s", response.status_code, owner, repo, response.text[:300])
        raise GitHubError(f"GitHub returned an error ({response.status_code}).", status_code=502)
    return _parse_repo_info(response.json())


async def _get_readme(client: httpx.AsyncClient, owner: str, repo: str) -> str:
    response = await client.get(f"/repos/{owner}/{repo}/readme")
    _raise_if_rate_limited(response)
    if response.status_code != 200:
        return ""  # a missing README is fine - not every repo has one

    content = response.json().get("content", "")
    try:
        decoded = base64.b64decode(content).decode("utf-8", errors="replace")
    except Exception:
        return ""

    if len(decoded) > README_MAX_CHARS:
        decoded = decoded[:README_MAX_CHARS] + "\n\n...[README truncated for length]..."
    return decoded


async def _get_contents(client: httpx.AsyncClient, owner: str, repo: str) -> list[dict]:
    response = await client.get(f"/repos/{owner}/{repo}/contents/")
    _raise_if_rate_limited(response)
    if response.status_code != 200:
        return []  # e.g. an empty repo

    data = response.json()
    if not isinstance(data, list):
        return []

    items = [{"name": item.get("name"), "type": item.get("type")} for item in data]
    # folders first, then files, each alphabetically
    items.sort(key=lambda i: (i["type"] != "dir", (i["name"] or "").lower()))
    return items


async def fetch_repo_bundle(
    owner: str, repo: str, transport: httpx.AsyncBaseTransport | None = None
) -> tuple[dict, str, list[dict]]:
    """Returns (repo_info, readme, contents). `transport` is only used by tests."""
    # follow_redirects: renamed/transferred repos (e.g. tiangolo/fastapi ->
    # fastapi/fastapi) answer with a 301 pointing at the new location.
    async with httpx.AsyncClient(
        base_url=GITHUB_API_BASE,
        headers=_headers(),
        timeout=15,
        transport=transport,
        follow_redirects=True,
    ) as client:
        try:
            info, readme, contents = await asyncio.gather(
                _get_repo_info(client, owner, repo),
                _get_readme(client, owner, repo),
                _get_contents(client, owner, repo),
            )
            return info, readme, contents
        except httpx.HTTPError as exc:
            log.exception("Network error talking to GitHub for %s/%s", owner, repo)
            raise GitHubError(f"Could not reach GitHub: {exc!r}", status_code=502) from exc


async def rate_limit_status() -> dict:
    """
    For /health: how much GitHub quota this server has left.
    Calling /rate_limit does NOT itself use up quota.
    """
    try:
        async with httpx.AsyncClient(base_url=GITHUB_API_BASE, headers=_headers(), timeout=10) as client:
            response = await client.get("/rate_limit")
        if response.status_code == 401:
            return {"token_set": _token_is_set(), "error": "token rejected (401)"}
        core = response.json().get("resources", {}).get("core", {})
        return {
            "token_set": _token_is_set(),
            "limit": core.get("limit"),
            "remaining": core.get("remaining"),
            "resets_at": core.get("reset"),
        }
    except Exception as exc:  # health checks must never crash
        return {"token_set": _token_is_set(), "error": repr(exc)}
