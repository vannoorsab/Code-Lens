"""CODE-LENS Hindsight Memory Engine Integration Seam.

Step 1 & Step 3 Implementation:
- Abstract HindsightMemoryProvider interface
- Real Hindsight HTTP API Client (using official Retain/Recall/Reflect endpoints)
- Structured logging & error handling
- Repository/project level memory isolation
"""

from __future__ import annotations

import logging
import time
from typing import Any, Protocol

import httpx

from app.core.config import settings
from app.semantic.memory_models import (
    BankStats,
    ConnectionHealth,
    ExperienceMemory,
    MemoryCategory,
    MemoryQuery,
    MemoryReflectContext,
    RecallResult,
    ReflectResult,
    RetainResult,
)


logger = logging.getLogger(__name__)


class HindsightMemoryProvider(Protocol):
    """Abstract interface contract for Hindsight Memory provider."""

    def get_health(self) -> ConnectionHealth: ...
    def retain(self, memory: ExperienceMemory) -> RetainResult: ...
    def recall(self, query: MemoryQuery) -> RecallResult: ...
    def reflect(self, context: MemoryReflectContext) -> ReflectResult: ...
    def get_stats(self) -> BankStats: ...


class HindsightClient:
    """Official HTTP Client for Hindsight Memory Engine.

    Communicates with Hindsight server via REST endpoints:
    - POST /v1/default/banks/{bank_id}/memories/retain (or /v1/banks/{bank_id}/retain)
    - POST /v1/default/banks/{bank_id}/memories/recall (or /v1/banks/{bank_id}/recall)
    - POST /v1/default/banks/{bank_id}/reflect (or /v1/banks/{bank_id}/reflect)
    - GET /health
    """

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        bank_id: str | None = None,
        enabled: bool | None = None,
        timeout_seconds: int | None = None,
    ) -> None:
        self.base_url = (base_url or settings.HINDSIGHT_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.HINDSIGHT_API_KEY
        self.bank_id = bank_id or settings.HINDSIGHT_BANK_ID
        self.enabled = enabled if enabled is not None else settings.HINDSIGHT_ENABLED
        self.timeout = timeout_seconds or settings.HINDSIGHT_TIMEOUT_SECONDS
        
        # Local in-memory repository-isolated experience buffer for offline/test fallback
        self._local_memories: dict[str, list[ExperienceMemory]] = {}

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def get_health(self) -> ConnectionHealth:
        """Check connection health with the Hindsight server instance."""
        if not self.enabled:
            return ConnectionHealth(
                connected=False,
                hindsight_enabled=False,
                bank_id=self.bank_id,
                base_url=self.base_url,
                message="Hindsight memory engine is disabled in configuration (HINDSIGHT_ENABLED=false).",
            )

        health_urls = [
            f"{self.base_url}/health",
            f"{self.base_url}/v1/health",
            f"{self.base_url}/",
        ]
        
        last_error = ""
        for url in health_urls:
            try:
                with httpx.Client(timeout=3.0) as client:
                    resp = client.get(url, headers=self._headers())
                    if resp.status_code in (200, 204):
                        logger.info("Hindsight health check passed: %s", url)
                        return ConnectionHealth(
                            connected=True,
                            hindsight_enabled=True,
                            bank_id=self.bank_id,
                            base_url=self.base_url,
                            message="Successfully connected to Hindsight Memory Engine.",
                            version=resp.json().get("version") if resp.headers.get("content-type") == "application/json" else "1.0",
                        )
            except Exception as exc:
                last_error = str(exc)
                continue

        logger.warning("Hindsight connection health check failed: %s", last_error)
        return ConnectionHealth(
            connected=False,
            hindsight_enabled=True,
            bank_id=self.bank_id,
            base_url=self.base_url,
            message="Could not connect to Hindsight Memory server.",
            error=last_error or "Service unreachable",
        )

    def _target_bank_id(self, repository: str) -> str:
        """Construct repository-isolated Hindsight Memory Bank namespace (Step 9)."""
        clean_repo = repository.replace("https://", "").replace("http://", "").replace("/", "-").replace(":", "-")
        clean_repo = "".join(c for c in clean_repo if c.isalnum() or c in ("-", "_")).lower().strip("-")
        return f"{self.bank_id}-{clean_repo}" if clean_repo else self.bank_id

    def retain(self, memory: ExperienceMemory) -> RetainResult:
        """Step 5: RETAIN experience into Hindsight memory engine."""
        started = time.monotonic()
        target_bank = self._target_bank_id(memory.repository)
        
        # Always record in local isolated buffer first
        self._local_memories.setdefault(target_bank, []).append(memory)

        if not self.enabled:
            logger.info("Local memory retained (Hindsight server disabled) [id=%s, cat=%s]", memory.id, memory.category.value)
            return RetainResult(
                memory_id=memory.id,
                status="retained_locally",
                bank_id=target_bank,
                detail="Memory retained in CODE-LENS local experience store (Hindsight engine disabled).",
            )

        payload = {
            "content": memory.to_hindsight_content(),
            "metadata": {
                "id": memory.id,
                "category": memory.category.value,
                "repository": memory.repository,
                "component": memory.component or "",
                "related_files": memory.related_files,
                "event_type": memory.event_type,
                "outcome": memory.outcome or "",
                "commit_sha": memory.commit_sha or "",
                "author": memory.author or "",
                "source": memory.source,
                "tags": memory.tags + [f"cat:{memory.category.value}", f"repo:{memory.repository}"],
                "timestamp": memory.timestamp,
            },
        }

        urls = [
            f"{self.base_url}/v1/default/banks/{target_bank}/memories/retain",
            f"{self.base_url}/v1/banks/{target_bank}/memories/retain",
            f"{self.base_url}/v1/banks/{target_bank}/retain",
        ]

        for url in urls:
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(url, json=payload, headers=self._headers())
                    if resp.status_code in (200, 201, 202):
                        elapsed = (time.monotonic() - started) * 1000
                        logger.info(
                            "Hindsight RETAIN success [id=%s, bank=%s, elapsed=%.1fms]",
                            memory.id,
                            target_bank,
                            elapsed,
                        )
                        data = resp.json() if resp.content else {}
                        return RetainResult(
                            memory_id=data.get("id", memory.id),
                            status="retained",
                            bank_id=target_bank,
                            detail="Successfully retained in Hindsight memory engine.",
                        )
            except Exception as exc:
                logger.debug("Hindsight retain endpoint %s failed: %s", url, exc)
                continue

        logger.warning(
            "Hindsight remote RETAIN failed; memory preserved in local fallback store [id=%s, bank=%s]",
            memory.id,
            target_bank,
        )
        return RetainResult(
            memory_id=memory.id,
            status="retained_fallback",
            bank_id=target_bank,
            detail="Remote Hindsight retain endpoint unreachable; saved to local fallback memory store.",
        )

    def recall(self, query: MemoryQuery) -> RecallResult:
        """Step 6: RECALL relevant historical experiences from Hindsight."""
        started = time.monotonic()
        target_bank = self._target_bank_id(query.repository)

        # 1. Search remote Hindsight instance if enabled
        remote_memories: list[ExperienceMemory] = []
        if self.enabled:
            payload = {
                "query": query.query_text,
                "budget": "mid",
                "limit": query.limit,
                "tags": query.tags + [f"repo:{query.repository}"],
            }
            urls = [
                f"{self.base_url}/v1/default/banks/{target_bank}/memories/recall",
                f"{self.base_url}/v1/banks/{target_bank}/memories/recall",
                f"{self.base_url}/v1/banks/{target_bank}/recall",
            ]
            for url in urls:
                try:
                    with httpx.Client(timeout=self.timeout) as client:
                        resp = client.post(url, json=payload, headers=self._headers())
                        if resp.status_code == 200:
                            data = resp.json()
                            raw_items = data.get("memories") or data.get("results") or []
                            for item in raw_items:
                                meta = item.get("metadata", {})
                                memory = ExperienceMemory(
                                    id=meta.get("id") or item.get("id", str(time.time())),
                                    category=meta.get("category", "CODE_REVIEW"),
                                    repository=query.repository,
                                    component=meta.get("component"),
                                    related_files=meta.get("related_files", []),
                                    description=item.get("content") or item.get("text", str(item)),
                                    outcome=meta.get("outcome"),
                                    commit_sha=meta.get("commit_sha"),
                                    author=meta.get("author"),
                                    tags=meta.get("tags", []),
                                )
                                remote_memories.append(memory)
                            break
                except Exception as exc:
                    logger.debug("Hindsight recall endpoint %s failed: %s", url, exc)
                    continue

        # 2. Local memory recall matching (combines with remote or serves local fallback)
        local_candidates = self._local_memories.get(target_bank, [])
        query_terms = set(query.query_text.lower().split())
        if query.files:
            query_terms.update(f.lower() for f in query.files)
        if query.affected_symbols:
            query_terms.update(s.lower() for s in query.affected_symbols)

        matched_local: list[ExperienceMemory] = []
        valid_terms = [t for t in query_terms if len(t) > 2]
        for mem in local_candidates:
            mem_text = (mem.description + " " + " ".join(mem.related_files) + " " + (mem.component or "")).lower()
            if not valid_terms or any(term in mem_text for term in valid_terms):
                matched_local.append(mem)

        # Merge deduplicated memories
        seen_ids = set()
        merged_memories: list[ExperienceMemory] = []
        for m in remote_memories + matched_local:
            if m.id not in seen_ids:
                seen_ids.add(m.id)
                merged_memories.append(m)

        merged_memories = merged_memories[: query.limit]

        # 3. Format clear distinction between Current Code Evidence vs Historical Memory Evidence (Step 6 & 8)
        current_code_evidence = [
            {"type": "queried_files", "files": query.files},
            {"type": "affected_symbols", "symbols": query.affected_symbols},
        ]
        if query.component:
            current_code_evidence.append({"type": "target_component", "component": query.component})

        historical_memory_evidence = [
            {
                "memory_id": m.id,
                "category": m.category.value,
                "description": m.description,
                "related_files": m.related_files,
                "outcome": m.outcome,
                "author": m.author,
                "commit_sha": m.commit_sha,
                "source": m.source,
            }
            for m in merged_memories
        ]

        elapsed = (time.monotonic() - started) * 1000
        logger.info(
            "Hindsight RECALL completed [repo=%s, query=%r, recalled=%d, latency=%.1fms]",
            query.repository,
            query.query_text[:40],
            len(merged_memories),
            elapsed,
        )

        return RecallResult(
            query=query.query_text,
            bank_id=target_bank,
            memories=merged_memories,
            current_code_evidence=current_code_evidence,
            historical_memory_evidence=historical_memory_evidence,
            total_recalled=len(merged_memories),
            latency_ms=elapsed,
        )

    def reflect(self, context: MemoryReflectContext) -> ReflectResult:
        """Step 7: REFLECT over historical experience memories + current code facts."""
        started = time.monotonic()
        target_bank = self._target_bank_id(context.repository)

        # 1. Attempt remote Hindsight Reflect API if enabled
        if self.enabled:
            payload = {
                "query": context.query_text,
                "include_trace": True,
                "context": {
                    "current_code_evidence": context.current_code_evidence,
                    "historical_memories": [m.to_hindsight_content() for m in context.historical_memories],
                },
            }
            urls = [
                f"{self.base_url}/v1/default/banks/{target_bank}/reflect",
                f"{self.base_url}/v1/banks/{target_bank}/reflect",
            ]
            for url in urls:
                try:
                    with httpx.Client(timeout=self.timeout) as client:
                        resp = client.post(url, json=payload, headers=self._headers())
                        if resp.status_code == 200:
                            data = resp.json()
                            elapsed = (time.monotonic() - started) * 1000
                            return ReflectResult(
                                recommendation=data.get("answer") or data.get("recommendation", ""),
                                reasoning=data.get("reasoning") or data.get("trace", "Hindsight reflection completed."),
                                current_evidence=context.current_code_evidence,
                                historical_evidence=[m.model_dump() for m in context.historical_memories],
                                memories_used=[m.id for m in context.historical_memories],
                                confidence=float(data.get("confidence", 0.95)),
                                latency_ms=elapsed,
                            )
                except Exception as exc:
                    logger.debug("Hindsight reflect endpoint %s failed: %s", url, exc)
                    continue

        # 2. Reflect reasoning synthesis fallback (combines code evidence + memories)
        reasoning_lines = []
        recommendation_lines = []

        if not context.historical_memories:
            reasoning_lines.append(
                f"No prior Hindsight memories found for repository '{context.repository}'. "
                "Recommendation is based strictly on current structural code evidence."
            )
            recommendation_lines.append(
                f"Proceed with proposed change to {context.query_text}. "
                "Ensure standard unit tests pass and blast-radius affected nodes are verified."
            )
        else:
            reasoning_lines.append(
                f"Analyzed {len(context.historical_memories)} historical team memories matching repository '{context.repository}':"
            )
            for mem in context.historical_memories:
                reasoning_lines.append(
                    f"- [{mem.category.value}] {mem.description} "
                    + (f"(Outcome: {mem.outcome})" if mem.outcome else "")
                )

            # Highlight specific categories (ADRs, Regressions, Code Reviews, Failed Approaches)
            regressions = [m for m in context.historical_memories if m.category in (MemoryCategory.REGRESSION, MemoryCategory.CHANGE_OUTCOME)]
            adrs = [m for m in context.historical_memories if m.category == MemoryCategory.ARCHITECTURE_DECISION]
            failed_approaches = [m for m in context.historical_memories if m.category == MemoryCategory.FAILED_APPROACH]
            conventions = [m for m in context.historical_memories if m.category in (MemoryCategory.CODE_REVIEW, MemoryCategory.TEAM_CONVENTION)]

            if adrs:
                recommendation_lines.append(
                    f"Architectural Alignment: Align with decision '{adrs[0].description}'."
                )
            if regressions:
                recommendation_lines.append(
                    f"Caution (Past Regression): Note previous bug '{regressions[0].description}'. Verify related files {regressions[0].related_files}."
                )
            if failed_approaches:
                recommendation_lines.append(
                    f"Avoid Anti-Pattern: Avoid approach '{failed_approaches[0].description}'."
                )
            if conventions:
                recommendation_lines.append(
                    f"Team Convention: Follow review rule '{conventions[0].description}'."
                )
            if not recommendation_lines:
                recommendation_lines.append(
                    f"Apply team experience from prior changes to '{context.query_text}'."
                )

        elapsed = (time.monotonic() - started) * 1000
        logger.info(
            "Hindsight REFLECT completed [repo=%s, memories_used=%d, latency=%.1fms]",
            context.repository,
            len(context.historical_memories),
            elapsed,
        )

        return ReflectResult(
            recommendation=" | ".join(recommendation_lines),
            reasoning="\n".join(reasoning_lines),
            current_evidence=context.current_code_evidence,
            historical_evidence=[
                {
                    "id": m.id,
                    "category": m.category.value,
                    "description": m.description,
                    "related_files": m.related_files,
                    "outcome": m.outcome,
                }
                for m in context.historical_memories
            ],
            memories_used=[m.id for m in context.historical_memories],
            confidence=0.9 if context.historical_memories else 0.7,
            latency_ms=elapsed,
        )

    def get_stats(self) -> BankStats:
        """Retrieve statistics for the current Memory Bank."""
        total = sum(len(mems) for mems in self._local_memories.values())
        return BankStats(bank_id=self.bank_id, total_memories=total, active=self.enabled, status="ok")


# Singleton Hindsight memory provider instance
_HINDSIGHT_PROVIDER: HindsightMemoryProvider | None = None


def get_hindsight_provider() -> HindsightMemoryProvider:
    """Get the active Hindsight Memory Provider instance."""
    global _HINDSIGHT_PROVIDER
    if _HINDSIGHT_PROVIDER is None:
        _HINDSIGHT_PROVIDER = HindsightClient()
    return _HINDSIGHT_PROVIDER
