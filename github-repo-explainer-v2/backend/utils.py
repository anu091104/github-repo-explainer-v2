"""
utils.py
--------
Turns whatever URL a user pastes in, e.g.
    https://github.com/owner/repo
    github.com/owner/repo/
    https://github.com/owner/repo.git
    https://github.com/owner/repo/tree/main/src
into a clean (owner, repo) pair that the GitHub REST API understands.
"""

import re
from urllib.parse import urlparse

from fastapi import HTTPException

# GitHub usernames/org names and repo names only use these characters.
_NAME_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


def parse_github_url(url: str) -> tuple[str, str]:
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="Please provide a GitHub repository URL.")

    cleaned = url.strip()
    if not re.match(r"^https?://", cleaned, re.IGNORECASE):
        cleaned = "https://" + cleaned

    parsed = urlparse(cleaned)
    host = (parsed.hostname or "").lower()

    # Exact match, so look-alikes such as "notgithub.com" are rejected.
    if host not in ("github.com", "www.github.com"):
        raise HTTPException(
            status_code=400,
            detail="That doesn't look like a github.com URL. Try something like "
            "https://github.com/owner/repository",
        )

    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        raise HTTPException(
            status_code=400,
            detail="Couldn't find an owner and repository name in that URL.",
        )

    owner, repo = parts[0], parts[1].removesuffix(".git")

    if not _NAME_RE.match(owner) or not _NAME_RE.match(repo):
        raise HTTPException(status_code=400, detail="That owner/repository name isn't valid.")

    return owner, repo
