"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Stale-while-revalidate: on load, ask the server to refresh portal snapshots,
 * then re-render from the (now fresh) cache. No background scheduler needed —
 * opening the dashboard is the trigger. Fire-and-forget; failures are silent.
 */
export function AutoPoll() {
  const router = useRouter();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fetch("/api/poll", { method: "POST" })
      .then((r) => {
        if (r.ok) router.refresh();
      })
      .catch(() => {});
  }, [router]);
  return null;
}
