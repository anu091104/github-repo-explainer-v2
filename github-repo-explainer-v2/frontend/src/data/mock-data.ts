import type { AnalyzeResponse, ExampleRepo } from "@/types/analysis";

/**
 * MOCK DATA
 * ---------
 * This is a stand-in for what POST /analyze actually returns from the
 * FastAPI backend. It exists so the UI can be built, previewed, and
 * demoed WITHOUT needing the backend running or burning a real Gemini
 * API call every time you refresh the page during development.
 *
 * TO WIRE UP THE REAL API:
 *   In src/App.tsx, the `handleAnalyze` function currently calls
 *   `analyzeRepository(url)` from `lib/api.ts`, which already hits the
 *   real FastAPI backend. This mock object is only used as the
 *   pre-populated example shown before you run your first real search
 *   (see `MOCK_ANALYSIS_RESPONSE` usage in App.tsx's initial state).
 *   To remove it entirely, just set the initial `result` state to
 *   `null` instead of this object.
 */
export const MOCK_ANALYSIS_RESPONSE: AnalyzeResponse = {
  repo: {
    name: "fastapi",
    full_name: "tiangolo/fastapi",
    description:
      "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
    stars: 82400,
    forks: 7100,
    open_issues: 158,
    language: "Python",
    owner: "tiangolo",
    owner_avatar: "",
    html_url: "https://github.com/tiangolo/fastapi",
    topics: ["python", "api", "async", "openapi", "swagger", "rest", "pydantic"],
    default_branch: "master",
    license: "MIT License",
    created_at: "2018-12-08T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  readme: "# FastAPI\n\nFastAPI is a modern, fast web framework for building APIs...",
  contents: [
    { name: "docs", type: "dir" },
    { name: "fastapi", type: "dir" },
    { name: "tests", type: "dir" },
    { name: "pyproject.toml", type: "file" },
    { name: "README.md", type: "file" },
    { name: "LICENSE", type: "file" },
  ],
  analysis: {
    purpose:
      "FastAPI is a Python web framework for building APIs quickly with automatic validation, serialization, and interactive documentation. It's designed for building production-ready REST APIs and microservices with minimal boilerplate.",
    architecture:
      "The core of FastAPI sits on top of Starlette (for the async web layer) and Pydantic (for data validation). Route handlers are plain Python functions decorated with HTTP method decorators; type hints on function parameters are used to automatically validate requests and generate OpenAPI documentation.",
    tech_stack: ["Python", "Starlette", "Pydantic", "ASGI", "OpenAPI", "Uvicorn"],
    how_to_run: [
      "Install with: pip install fastapi uvicorn",
      "Create a main.py with your route definitions",
      "Run the dev server: uvicorn main:app --reload",
      "Visit /docs for interactive API documentation",
    ],
    interview_questions: [
      "How does FastAPI achieve automatic request validation?",
      "What is the difference between FastAPI and Flask?",
      "How does dependency injection work in FastAPI?",
      "What is Pydantic and why does FastAPI rely on it?",
      "How would you handle authentication in a FastAPI app?",
    ],
    improvements: [
      "Add built-in rate limiting middleware",
      "Provide first-party WebSocket testing utilities",
      "Expand background task documentation for production use",
    ],
  },
};

/** Shown in the quick-pick Select dropdown next to the URL input. */
export const EXAMPLE_REPOS: ExampleRepo[] = [
  { label: "facebook/react", url: "https://github.com/facebook/react" },
  { label: "langchain-ai/langchain", url: "https://github.com/langchain-ai/langchain" },
  { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
  { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
];
