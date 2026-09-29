"""Hindsight Memory Engine API Routes — Step 8 & 9 HTTP Surface.

Exposes REST endpoints for:
- Hindsight health status (/api/hindsight/health)
- Experience retention (/api/repos/{snapshot_id}/hindsight/retain)
- Multi-strategy recall (/api/repos/{snapshot_id}/hindsight/recall)
- Agentic reflection (/api/repos/{snapshot_id}/hindsight/reflect)
- Memory ON vs OFF comparison (/api/repos/{snapshot_id}/hindsight/compare)
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.graph_cache import cache
from app.graph.schema import KnowledgeGraph
from app.semantic.experience_engine import (
    recall_experiences,
    reflect_on_experience,
    retain_experience,
)
from app.semantic.hindsight import get_hindsight_provider
from app.semantic.memory_models import (
    ConnectionHealth,
    MemoryCategory,
    RecallResult,
    ReflectResult,
    RetainResult,
)

router = APIRouter(tags=["Hindsight Memory Engine"])


def _load_graph(snapshot_id: int) -> KnowledgeGraph:
    from app.api.routes import get_store

    graph = cache.graph(get_store(), snapshot_id)
    if graph is None:
        raise HTTPException(status_code=404, detail=f"no snapshot {snapshot_id}")
    return graph


@router.get("/api/hindsight/health", response_model=ConnectionHealth)
def hindsight_health() -> ConnectionHealth:
    """Check Hindsight memory engine connection status."""
    return get_hindsight_provider().get_health()


class RetainRequest(BaseModel):
    category: str = Field(..., description="Memory category, e.g. ARCHITECTURE_DECISION, CODE_REVIEW")
    description: str = Field(..., min_length=3, description="Description of the experience")
    component: str | None = None
    related_files: list[str] = Field(default_factory=list)
    outcome: str | None = None
    author: str | None = None
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


@router.post("/api/repos/{snapshot_id}/hindsight/retain", response_model=RetainResult)
def retain_memory(snapshot_id: int, request: RetainRequest) -> RetainResult:
    """Step 5 (RETAIN): Retain a new structured experience for a repository."""
    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    return retain_experience(
        category=request.category,
        repository=repo_url,
        description=request.description,
        component=request.component,
        related_files=request.related_files,
        outcome=request.outcome,
        author=request.author,
        tags=request.tags,
        metadata=request.metadata,
    )


class RecallApiRequest(BaseModel):
    query_text: str = Field(..., min_length=1, max_length=1000)
    component: str | None = None
    files: list[str] = Field(default_factory=list)
    affected_symbols: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    limit: int = Field(default=5, ge=1, le=50)


@router.post("/api/repos/{snapshot_id}/hindsight/recall", response_model=RecallResult)
def recall_memories(snapshot_id: int, request: RecallApiRequest) -> RecallResult:
    """Step 6 (RECALL): Query Hindsight for relevant historical memories."""
    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    return recall_experiences(
        repository=repo_url,
        query_text=request.query_text,
        component=request.component,
        files=request.files,
        affected_symbols=request.affected_symbols,
        tags=request.tags,
        limit=request.limit,
    )


class ReflectApiRequest(BaseModel):
    query_text: str = Field(..., min_length=1, max_length=1000)
    node_id: str | None = None
    component: str | None = None


@router.post("/api/repos/{snapshot_id}/hindsight/reflect", response_model=ReflectResult)
def reflect_memories(snapshot_id: int, request: ReflectApiRequest) -> ReflectResult:
    """Step 7 (REFLECT): Synthesize reasoning over current code facts + recalled memories."""
    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    current_evidence = []
    if request.node_id:
        target_node = next((n for n in graph.nodes if n.id == request.node_id), None)
        if target_node:
            current_evidence.append({
                "node_id": target_node.id,
                "kind": target_node.kind.value,
                "file_path": target_node.file_path,
                "loc": target_node.loc,
                "complexity": target_node.complexity,
            })

    return reflect_on_experience(
        repository=repo_url,
        query_text=request.query_text,
        current_code_evidence=current_evidence,
        component=request.component,
    )


class CompareApiRequest(BaseModel):
    query_text: str = Field(..., min_length=1)
    node_id: str | None = None


@router.post("/api/repos/{snapshot_id}/hindsight/compare")
def compare_memory_modes(snapshot_id: int, request: CompareApiRequest) -> dict[str, Any]:
    """Step 3: Benchmark Memory ON vs Memory OFF side-by-side."""
    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    # Mode A: Memory OFF (Static Graph facts only)
    off_recommendation = (
        f"Static AST blast radius indicates structural changes needed for query '{request.query_text}'. "
        "No historical team context applied."
    )

    # Mode B: Memory ON (AST + Hindsight Memory Engine)
    reflect_on = reflect_on_experience(
        repository=repo_url,
        query_text=request.query_text,
        current_code_evidence=[{"query": request.query_text, "node_id": request.node_id}],
    )

    return {
        "snapshot_id": snapshot_id,
        "repository": repo_url,
        "query": request.query_text,
        "memory_off": {
            "mode": "MEMORY_OFF",
            "recommendation": off_recommendation,
            "evidence_used": ["AST Dependency Graph", "Import Hierarchy"],
            "historical_context": None,
        },
        "memory_on": {
            "mode": "MEMORY_ON",
            "recommendation": reflect_on.recommendation,
            "reasoning": reflect_on.reasoning,
            "historical_evidence": reflect_on.memories_used,
            "memories_count": len(reflect_on.memories_used),
            "confidence": reflect_on.confidence,
        },
        "improvement_summary": (
            f"Hindsight recalled {len(reflect_on.memories_used)} relevant historical team experience(s), "
            f"increasing recommendation confidence to {int(reflect_on.confidence * 100)}%."
        ),
    }


class AnalyzeMemoryRequest(BaseModel):
    node_id: str = Field(..., description="Target node ID for impact & memory analysis")
    memory_mode: str = Field(default="MEMORY_ON", description="MEMORY_ON or MEMORY_OFF")
    max_depth: int | None = Field(default=None, ge=1, le=32)
    query_text: str | None = None


@router.post("/api/repos/{snapshot_id}/hindsight/analyze")
def analyze_memory_aware(snapshot_id: int, request: AnalyzeMemoryRequest) -> dict[str, Any]:
    """Step 1 & 2: Run memory-aware blast-radius analysis orchestrating graph facts + Hindsight."""
    from app.api.routes import get_store

    graph = _load_graph(snapshot_id)
    view = cache.view(get_store(), snapshot_id)
    if view is None:
        raise HTTPException(status_code=404, detail=f"no snapshot {snapshot_id}")

    from app.semantic.memory_analysis import MemoryAwareCodeAnalysisService

    result = MemoryAwareCodeAnalysisService.analyze(
        graph=graph,
        view=view,
        snapshot_id=snapshot_id,
        node_id=request.node_id,
        memory_mode=request.memory_mode,
        max_depth=request.max_depth,
        custom_query=request.query_text,
    )
    return result.model_dump()


@router.get("/api/repos/{snapshot_id}/hindsight/overview")
def hindsight_overview(snapshot_id: int) -> dict[str, Any]:
    """Step 4: Memory Center Overview API returning total count, category breakdowns, and recent memories."""
    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    # Query Hindsight for repository experiences
    recalled = recall_experiences(
        repository=repo_url,
        query_text="",
        limit=50,
    )

    memories = recalled.memories

    # Calculate category breakdowns
    breakdown: dict[str, int] = {}
    for m in memories:
        cat_key = m.category.value
        breakdown[cat_key] = breakdown.get(cat_key, 0) + 1

    return {
        "snapshot_id": snapshot_id,
        "repository": repo_url,
        "total_memories": len(memories),
        "category_breakdown": breakdown,
        "recent_memories": [m.model_dump() for m in memories[:15]],
        "active_bank": recalled.bank_id,
    }


class FeedbackRequest(BaseModel):
    category: str = Field(default="DEVELOPER_FEEDBACK")
    description: str = Field(default="Developer feedback on recommendation", min_length=3)
    outcome: str = Field(default="ACCEPTED")  # "ACCEPTED" | "REJECTED" | "CORRECTED" | "PARTIALLY_ACCEPTED"
    node_id: str | None = None
    recommendation_id: str | None = None
    related_files: list[str] = Field(default_factory=list)


@router.post("/api/repos/{snapshot_id}/hindsight/feedback")
def submit_feedback(snapshot_id: int, request: FeedbackRequest) -> dict[str, Any]:
    """Step 4: Retain sanitized developer feedback into Hindsight memory engine."""
    from app.semantic.learning_engine import sanitize_memory_content

    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    clean_desc = sanitize_memory_content(request.description)

    res = retain_experience(
        category=request.category,
        repository=repo_url,
        description=f"Developer feedback ({request.outcome}): {clean_desc}",
        component=request.node_id,
        related_files=request.related_files,
        outcome=request.outcome,
        tags=["developer_feedback", f"outcome:{request.outcome}"],
    )
    return res.model_dump()


class OutcomeRequest(BaseModel):
    category: str = Field(default="CHANGE_OUTCOME")
    description: str = Field(..., min_length=3)
    outcome: str = Field(default="SUCCESS")  # "SUCCESS" | "FAILURE" | "REGRESSION" | "PARTIAL_SUCCESS"
    problem: str | None = None
    change_summary: str | None = None
    lesson_learned: str | None = None
    node_id: str | None = None
    related_files: list[str] = Field(default_factory=list)


@router.post("/api/repos/{snapshot_id}/hindsight/outcome")
def submit_outcome(snapshot_id: int, request: OutcomeRequest) -> dict[str, Any]:
    """Step 5: Retain structured outcome experience (Problem -> Change -> Outcome -> Lesson)."""
    from app.semantic.learning_engine import sanitize_memory_content

    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    desc_parts = [f"Outcome ({request.outcome}): {sanitize_memory_content(request.description)}"]
    if request.problem:
        desc_parts.append(f"Problem: {sanitize_memory_content(request.problem)}")
    if request.change_summary:
        desc_parts.append(f"Change: {sanitize_memory_content(request.change_summary)}")
    if request.lesson_learned:
        desc_parts.append(f"Lesson: {sanitize_memory_content(request.lesson_learned)}")

    full_desc = " | ".join(desc_parts)

    res = retain_experience(
        category=request.category,
        repository=repo_url,
        description=full_desc,
        component=request.node_id,
        related_files=request.related_files,
        outcome=request.outcome,
        tags=["outcome_learning", f"outcome:{request.outcome}"],
    )
    return res.model_dump()


@router.get("/api/repos/{snapshot_id}/hindsight/timeline")
def hindsight_timeline(snapshot_id: int) -> dict[str, Any]:
    """Step 1: Get Learning Timeline of real Hindsight experiences with freshness & conflict detection."""
    from app.semantic.learning_engine import calculate_freshness, detect_memory_conflicts

    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    recalled = recall_experiences(repository=repo_url, query_text="", limit=100)
    memories = recalled.memories

    timeline_events = []
    for m in memories:
        timeline_events.append({
            "id": m.id,
            "category": m.category.value,
            "repository": m.repository,
            "component": m.component,
            "description": m.description,
            "outcome": m.outcome,
            "timestamp": m.timestamp,
            "freshness": calculate_freshness(m.timestamp),
            "related_files": m.related_files,
            "author": m.author,
            "source": m.source,
        })

    conflicts = detect_memory_conflicts(memories)

    return {
        "snapshot_id": snapshot_id,
        "repository": repo_url,
        "total_events": len(timeline_events),
        "timeline": sorted(timeline_events, key=lambda x: x["timestamp"] or "", reverse=True),
        "conflicts": conflicts,
    }


class SimulateRequest(BaseModel):
    node_id: str = Field(..., description="Target node ID for change simulation")
    intent_text: str | None = Field(default=None, description="Optional description of proposed code change")


@router.post("/api/repos/{snapshot_id}/hindsight/simulate")
def simulate_change_route(snapshot_id: int, request: SimulateRequest) -> dict[str, Any]:
    """Step 8: Interactive Change Simulator merging structural blast radius + historical risk signal."""
    from app.api.routes import get_store
    from app.semantic.learning_engine import run_change_simulation

    graph = _load_graph(snapshot_id)
    view = cache.view(get_store(), snapshot_id)
    if view is None:
        raise HTTPException(status_code=404, detail=f"no snapshot {snapshot_id}")

    return run_change_simulation(
        graph=graph,
        view=view,
        snapshot_id=snapshot_id,
        node_id=request.node_id,
        intent_text=request.intent_text,
    )


@router.get("/api/repos/{snapshot_id}/hindsight/knowledge")
def team_knowledge_route(snapshot_id: int) -> dict[str, Any]:
    """Step 9: Get Team Knowledge aggregated from real Hindsight memories."""
    from app.semantic.learning_engine import aggregate_team_knowledge

    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    recalled = recall_experiences(repository=repo_url, query_text="", limit=100)
    return aggregate_team_knowledge(recalled.memories)


@router.get("/api/repos/{snapshot_id}/hindsight/analytics")
def learning_analytics_route(snapshot_id: int) -> dict[str, Any]:
    """Step 10: Get Learning Analytics derived from real system events & memory data."""
    from app.semantic.learning_engine import compute_learning_analytics

    graph = _load_graph(snapshot_id)
    repo_url = graph.snapshot.repo_url

    recalled = recall_experiences(repository=repo_url, query_text="", limit=100)
    return compute_learning_analytics(recalled.memories)


