"""CODE-LENS Memory-Aware Code Analysis Service — Step 1 & 2 Orchestrator.

Combines:
- CODE-LENS Knowledge Graph static facts
- Blast-radius dependency traversal
- Hindsight RECALL (recalculating team experience)
- Hindsight REFLECT (agentic experience synthesis)
- Transparent Agent Activity Trace & Evidence Attribution
"""

from __future__ import annotations

import logging
import time
from typing import Any
from pydantic import BaseModel, Field

from app.graph.schema import KnowledgeGraph
from app.graph.traversal import GraphView
from app.queries import run_query
from app.semantic.experience_engine import recall_experiences, reflect_on_experience
from app.semantic.hindsight import get_hindsight_provider
from app.semantic.memory_models import ExperienceMemory, ReflectResult

logger = logging.getLogger(__name__)


class AgentTraceStep(BaseModel):
    """One step in the transparent Agent Activity Trace."""

    step_number: int
    name: str
    status: str  # "success" | "warning" | "in_progress" | "error"
    detail: str
    duration_ms: float = 0.0


class MemoryAwareAnalysisResult(BaseModel):
    """Complete structured output combining structural analysis & Hindsight memory."""

    snapshot_id: int
    node_id: str
    repository: str
    memory_mode: str  # "MEMORY_ON" or "MEMORY_OFF"
    current_analysis: dict[str, Any]
    historical_memories: list[ExperienceMemory] = Field(default_factory=list)
    historical_evidence: list[dict[str, Any]] = Field(default_factory=list)
    reflection: dict[str, Any] = Field(default_factory=dict)
    recommendation: str
    reasoning: str
    memories_used: list[str] = Field(default_factory=list)
    confidence: float = 1.0
    agent_trace: list[AgentTraceStep] = Field(default_factory=list)
    total_latency_ms: float = 0.0


class MemoryAwareCodeAnalysisService:
    """Orchestrates structural graph blast radius + Hindsight experience recall & reflection."""

    @staticmethod
    def analyze(
        graph: KnowledgeGraph,
        view: GraphView,
        snapshot_id: int,
        node_id: str,
        *,
        memory_mode: str = "MEMORY_ON",
        max_depth: int | None = None,
        custom_query: str | None = None,
    ) -> MemoryAwareAnalysisResult:
        started = time.monotonic()
        trace: list[AgentTraceStep] = []
        repo_url = graph.snapshot.repo_url

        # ── Step 1: Understand Request & Inspect AST Node ────────────────────
        s1_start = time.monotonic()
        focus_node = view.node(node_id)
        node_name = focus_node.name if focus_node else node_id
        file_path = focus_node.file_path if focus_node else None
        
        trace.append(
            AgentTraceStep(
                step_number=1,
                name="Understand Request",
                status="success",
                detail=f"Target node: '{node_name}' ({focus_node.kind.value if focus_node else 'unknown'})",
                duration_ms=round((time.monotonic() - s1_start) * 1000, 2),
            )
        )

        # ── Step 2: Calculate Structural Blast Radius ────────────────────────
        s2_start = time.monotonic()
        try:
            blast_result = run_query("blast_radius", view, node_id=node_id, max_depth=max_depth)
            blast_payload = blast_result.model_dump()
            affected_nodes = blast_result.node_ids
            total_affected = blast_result.meta.get("total_affected", len(affected_nodes))

            # Extract affected file paths
            affected_files = set()
            if file_path:
                affected_files.add(file_path)
            for ranked_node in blast_result.ranked:
                rf = ranked_node.reasons.get("file_path")
                if rf:
                    affected_files.add(rf)

            trace.append(
                AgentTraceStep(
                    step_number=2,
                    name="Calculate Blast Radius",
                    status="success",
                    detail=f"Found {total_affected} downstream dependent symbols across {len(affected_files)} files.",
                    duration_ms=round((time.monotonic() - s2_start) * 1000, 2),
                )
            )
        except Exception as err:
            logger.warning(f"Blast radius query failed for node '{node_id}': {err}")
            blast_payload = {"focus_id": node_id, "node_ids": [], "ranked": [], "paths": {}, "meta": {"total_affected": 0}}
            affected_nodes = []
            total_affected = 0
            affected_files = set([file_path]) if file_path else set()

            trace.append(
                AgentTraceStep(
                    step_number=2,
                    name="Calculate Blast Radius",
                    status="warning",
                    detail=f"Target node '{node_id}' not found in static AST graph. Proceeding with Hindsight recall.",
                    duration_ms=round((time.monotonic() - s2_start) * 1000, 2),
                )
            )

        # ── MODE A: Memory OFF (Pure Static Graph Baseline) ───────────────────
        if memory_mode.upper() == "MEMORY_OFF":
            trace.append(
                AgentTraceStep(
                    step_number=3,
                    name="Hindsight Memory Recall",
                    status="warning",
                    detail="Memory Engine BYPASSED (Memory OFF mode).",
                    duration_ms=0.0,
                )
            )
            trace.append(
                AgentTraceStep(
                    step_number=4,
                    name="Generate Baseline Guidance",
                    status="success",
                    detail="Generated generic recommendation based on graph topology only.",
                    duration_ms=round((time.monotonic() - started) * 1000, 2),
                )
            )

            rec = (
                f"Modifying '{node_name}' affects {total_affected} dependent symbols across {len(affected_files)} files. "
                f"Verify downstream calls and run standard unit tests for touched files."
            )
            reas = (
                f"Static analysis identified {total_affected} downstream nodes in the dependency graph. "
                f"Top affected file paths: {', '.join(sorted(list(affected_files))[:3])}."
            )

            return MemoryAwareAnalysisResult(
                snapshot_id=snapshot_id,
                node_id=node_id,
                repository=repo_url,
                memory_mode="MEMORY_OFF",
                current_analysis=blast_payload,
                historical_memories=[],
                historical_evidence=[],
                reflection={},
                recommendation=rec,
                reasoning=reas,
                memories_used=[],
                confidence=0.75,
                agent_trace=trace,
                total_latency_ms=round((time.monotonic() - started) * 1000, 2),
            )

        # ── MODE B: Memory ON (Hindsight RECALL + REFLECT) ─────────────────────
        s3_start = time.monotonic()
        query_text = custom_query or f"Modifying {node_name} in {file_path or 'repository'}"
        
        provider_health = get_hindsight_provider().get_health()
        hindsight_status = "success" if provider_health.connected else "warning"

        recalled = recall_experiences(
            repository=repo_url,
            query_text=query_text,
            component=file_path,
            files=list(affected_files),
            affected_symbols=[node_name],
            limit=10,
        )
        s3_ms = round((time.monotonic() - s3_start) * 1000, 2)

        if recalled.total_recalled > 0:
            recall_detail = f"Retrieved {recalled.total_recalled} relevant historical team memories."
        elif not provider_health.connected:
            recall_detail = "Hindsight server offline; searched local experience buffer (0 matches)."
        else:
            recall_detail = "No prior team memories found for this specific module."

        trace.append(
            AgentTraceStep(
                step_number=3,
                name="Hindsight Memory Recall",
                status=hindsight_status,
                detail=recall_detail,
                duration_ms=s3_ms,
            )
        )

        # ── Step 4: Reflect over Code Facts + Memories ────────────────────────
        s4_start = time.monotonic()
        current_code_evidence = [
            {
                "target": node_name,
                "file_path": file_path,
                "total_affected_symbols": total_affected,
                "affected_files": list(affected_files),
            }
        ]

        reflect_res = reflect_on_experience(
            repository=repo_url,
            query_text=query_text,
            current_code_evidence=current_code_evidence,
            historical_memories=recalled.memories,
            component=file_path,
        )
        s4_ms = round((time.monotonic() - s4_start) * 1000, 2)

        trace.append(
            AgentTraceStep(
                step_number=4,
                name="Hindsight Reflect & Synthesize",
                status="success",
                detail=f"Synthesized code evidence + {len(recalled.memories)} memories into contextual recommendation.",
                duration_ms=s4_ms,
            )
        )

        total_elapsed = round((time.monotonic() - started) * 1000, 2)

        return MemoryAwareAnalysisResult(
            snapshot_id=snapshot_id,
            node_id=node_id,
            repository=repo_url,
            memory_mode="MEMORY_ON",
            current_analysis=blast_payload,
            historical_memories=recalled.memories,
            historical_evidence=recalled.historical_memory_evidence,
            reflection=reflect_res.model_dump(),
            recommendation=reflect_res.recommendation,
            reasoning=reflect_res.reasoning,
            memories_used=reflect_res.memories_used,
            confidence=reflect_res.confidence,
            agent_trace=trace,
            total_latency_ms=total_elapsed,
        )
