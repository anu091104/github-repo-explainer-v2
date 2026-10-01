import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export type ApiStatus = "checking" | "online" | "misconfigured" | "offline";

// Shared across components so the sidebar (desktop + mobile drawer)
// only triggers ONE health request per page load.
let healthPromise: Promise<ApiStatus> | null = null;

function loadStatus(): Promise<ApiStatus> {
  if (!healthPromise) {
    healthPromise = checkHealth()
      .then((h) => (h.gemini_configured ? "online" : "misconfigured") as ApiStatus)
      .catch(() => "offline" as ApiStatus);
  }
  return healthPromise;
}

/** Real backend status, instead of a hard-coded "Online" badge. */
export function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let active = true;
    loadStatus().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
