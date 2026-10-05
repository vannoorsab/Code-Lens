"use client";

import { useEffect, useState } from "react";
import { searchSymbols } from "./api";
import { useGraphStore } from "./store";

/** Concept search, as one hook.
 *
 *  The palette had this logic inline, which was fine while ⌘K was the only
 *  door to it. It is no longer: the top bar now carries a visible field, and
 *  two components debouncing the same endpoint in two slightly different ways
 *  is how they drift apart. One request per pause, one shape of result,
 *  cancelled the moment the query moves on.
 */
export interface SearchHit {
  /** The graph's own id — what `goTo` navigates to. */
  id: string;
  name: string;
  path: string;
  /** `file`, `function`, `class`, `module` — decides which level can draw it. */
  kind: string | null;
  line: number | null;
}

/** Below this, every query matches half the repository. */
export const MIN_QUERY = 2;
const DEBOUNCE_MS = 160;

export function useConceptSearch(text: string, active: boolean, top = 10) {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = text.trim();
    if (!active || snapshotId === null || query.length < MIN_QUERY) {
      setHits([]);
      setPending(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setPending(true);
    const timer = window.setTimeout(() => {
      void searchSymbols(snapshotId, query, top)
        .then((result) => {
          if (cancelled) return;
          setHits(result.map(toHit));
          setError(null);
        })
        .catch((failure: Error) => {
          if (cancelled) return;
          setHits([]);
          setError(failure.message);
        })
        .finally(() => {
          if (!cancelled) setPending(false);
        });
    }, DEBOUNCE_MS); // one request per pause, not per keystroke

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, active, snapshotId, top]);

  return { hits, pending, error };
}

function toHit(entry: { id: string; label: string; kind?: string; file_path?: string | null }): SearchHit {
  return {
    id: entry.id,
    name: entry.label ?? entry.id.split(":").slice(1).join(":"),
    path: entry.file_path ?? "",
    kind: entry.kind ?? null,
    line: null,
  };
}
