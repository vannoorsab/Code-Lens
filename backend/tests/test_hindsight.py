"""Unit and API Integration Tests for Hindsight Memory Engine Integration (Step 11).

Tests:
1. Configuration defaults and environment variables
2. Connection health status (enabled vs disabled vs unreachable)
3. ExperienceMemory models, categories, and Hindsight formatting
4. Memory Provider operations: RETAIN, RECALL, REFLECT
5. Repository memory isolation namespaces
6. FastAPI endpoints: /api/hindsight/health, /retain, /recall, /reflect, /compare
"""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from app.api.routes import get_store
from app.core.config import Settings
from app.graph.schema import KnowledgeGraph, RepoSnapshot
from app.graph.store import SQLiteGraphStore
from app.main import app
from app.semantic.experience_engine import (
    recall_experiences,
    reflect_on_experience,
    retain_experience,
)
from app.semantic.hindsight import HindsightClient, get_hindsight_provider
from app.semantic.memory_models import (
    ExperienceMemory,
    MemoryCategory,
    MemoryQuery,
    MemoryReflectContext,
)


def test_hindsight_config_defaults():
    """Verify configuration settings for Hindsight memory engine."""
    config = Settings()
    assert hasattr(config, "HINDSIGHT_ENABLED")
    assert hasattr(config, "HINDSIGHT_BASE_URL")
    assert hasattr(config, "HINDSIGHT_BANK_ID")
    assert config.HINDSIGHT_TIMEOUT_SECONDS > 0


def test_experience_memory_model():
    """Verify ExperienceMemory formatting and serialization."""
    mem = ExperienceMemory(
        category=MemoryCategory.ARCHITECTURE_DECISION,
        repository="psf/requests",
        component="sessions.py",
        related_files=["requests/sessions.py", "requests/adapters.py"],
        description="Centralized connection pooling inside HTTPAdapter.",
        author="developer@example.com",
    )
    formatted = mem.to_hindsight_content()
    assert "[ARCHITECTURE_DECISION]" in formatted
    assert "[psf/requests]" in formatted
    assert "requests/sessions.py" in formatted
    assert "HTTPAdapter" in formatted


def test_hindsight_client_health():
    """Test connection health reporting."""
    # When disabled
    client_disabled = HindsightClient(enabled=False)
    health_disabled = client_disabled.get_health()
    assert not health_disabled.connected
    assert not health_disabled.hindsight_enabled

    # When enabled but host unreachable
    client_enabled = HindsightClient(enabled=True, base_url="http://127.0.0.1:59999")
    health_enabled = client_enabled.get_health()
    assert not health_enabled.connected
    assert health_enabled.hindsight_enabled
    assert health_enabled.error is not None


def test_hindsight_retain_recall_reflect_workflow():
    """Test full RETAIN, RECALL, and REFLECT experience workflow."""
    client = HindsightClient(enabled=False, bank_id="test-bank")

    # 1. RETAIN experience
    mem = ExperienceMemory(
        category=MemoryCategory.REGRESSION,
        repository="owner/test-repo",
        component="app.core.pipeline",
        related_files=["backend/app/core/pipeline.py"],
        description="Releasing concurrency slot in finally block prevented thread deadlocks.",
        outcome="RESOLVED",
        author="reviewer@team.com",
    )
    retain_res = client.retain(mem)
    assert retain_res.status in ("retained_locally", "retained")
    assert retain_res.memory_id == mem.id

    # 2. RECALL experience
    query = MemoryQuery(
        repository="owner/test-repo",
        query_text="concurrency pipeline deadlock",
        files=["backend/app/core/pipeline.py"],
    )
    recall_res = client.recall(query)
    assert recall_res.total_recalled >= 1
    assert recall_res.memories[0].id == mem.id
    assert len(recall_res.current_code_evidence) > 0
    assert len(recall_res.historical_memory_evidence) > 0

    # 3. REFLECT experience
    context = MemoryReflectContext(
        repository="owner/test-repo",
        query_text="Modifying pipeline.py concurrency slots",
        current_code_evidence=[{"file": "backend/app/core/pipeline.py"}],
        historical_memories=recall_res.memories,
    )
    reflect_res = client.reflect(context)
    assert reflect_res.recommendation != ""
    assert reflect_res.confidence >= 0.7
    assert mem.id in reflect_res.memories_used


def test_repository_memory_isolation():
    """Verify memories are strictly isolated by repository namespace (Step 9)."""
    client = HindsightClient(enabled=False, bank_id="test-bank")

    # Retain memory for Repo A
    mem_a = ExperienceMemory(
        category=MemoryCategory.TEAM_CONVENTION,
        repository="org/repo-a",
        description="Use strict Pydantic schemas for Repo A API endpoints.",
    )
    client.retain(mem_a)

    # Retain memory for Repo B
    mem_b = ExperienceMemory(
        category=MemoryCategory.TEAM_CONVENTION,
        repository="org/repo-b",
        description="Use GraphQL schemas for Repo B frontend.",
    )
    client.retain(mem_b)

    # Recall for Repo A should NOT return Repo B's memory
    recalled_a = client.recall(MemoryQuery(repository="org/repo-a", query_text="schemas"))
    recalled_b = client.recall(MemoryQuery(repository="org/repo-b", query_text="schemas"))

    a_ids = [m.id for m in recalled_a.memories]
    b_ids = [m.id for m in recalled_b.memories]

    assert mem_a.id in a_ids
    assert mem_b.id not in a_ids
    assert mem_b.id in b_ids
    assert mem_a.id not in b_ids


from app.graph.schema import KnowledgeGraph, Node, NodeKind, RepoSnapshot

def test_hindsight_api_routes():
    """Test FastAPI endpoints for Hindsight integration over HTTP TestClient."""
    db_file = Path(tempfile.gettempdir()) / "test_hindsight_api.db"
    if db_file.exists():
        try:
            db_file.unlink()
        except OSError:
            pass

    store = SQLiteGraphStore(db_file)
    try:
        snapshot = RepoSnapshot(
            repo_url="https://github.com/psf/requests",
            commit_sha="abc1234",
            primary_language="Python",
            languages={"py": 10},
            file_count=5,
            analyzed_at="2026-09-28T00:00:00Z",
        )
        node_auth = Node(
            id="file:auth.py",
            kind=NodeKind.FILE,
            name="auth.py",
            qualified_name="auth.py",
            file_path="auth.py",
        )
        graph = KnowledgeGraph(snapshot=snapshot, nodes=[node_auth], edges=[])
        sid = store.save_graph(graph)

        import app.api.routes as routes
        routes._STORE = store

        with TestClient(app) as test_client:
            # 1. Health check
            res_health = test_client.get("/api/hindsight/health")
            assert res_health.status_code == 200
            assert "connected" in res_health.json()

            # 2. Retain
            res_retain = test_client.post(
                f"/api/repos/{sid}/hindsight/retain",
                json={
                    "category": "ARCHITECTURE_DECISION",
                    "description": "Centralized auth handling in auth.py",
                    "related_files": ["auth.py"],
                },
            )
            assert res_retain.status_code == 200
            assert res_retain.json()["status"] in ("retained_locally", "retained")

            # 3. Recall
            res_recall = test_client.post(
                f"/api/repos/{sid}/hindsight/recall",
                json={"query_text": "auth handling auth.py"},
            )
            assert res_recall.status_code == 200
            assert "memories" in res_recall.json()

            # 4. Reflect
            res_reflect = test_client.post(
                f"/api/repos/{sid}/hindsight/reflect",
                json={"query_text": "How should auth be updated?"},
            )
            assert res_reflect.status_code == 200
            assert "recommendation" in res_reflect.json()

            # 5. Compare (Memory ON vs Memory OFF)
            res_compare = test_client.post(
                f"/api/repos/{sid}/hindsight/compare",
                json={"query_text": "Refactoring auth.py module"},
            )
            assert res_compare.status_code == 200
            data = res_compare.json()
            assert data["memory_off"]["mode"] == "MEMORY_OFF"
            assert data["memory_on"]["mode"] == "MEMORY_ON"
            assert "improvement_summary" in data

            # 6. Memory-Aware Analysis (/hindsight/analyze)
            res_analyze = test_client.post(
                f"/api/repos/{sid}/hindsight/analyze",
                json={"node_id": "file:auth.py", "memory_mode": "MEMORY_ON"},
            )
            assert res_analyze.status_code == 200
            analyze_data = res_analyze.json()
            assert analyze_data["memory_mode"] == "MEMORY_ON"
            assert "recommendation" in analyze_data
            assert "agent_trace" in analyze_data
            assert len(analyze_data["agent_trace"]) >= 4

            # 7. Memory Overview (/hindsight/overview)
            res_overview = test_client.get(f"/api/repos/{sid}/hindsight/overview")
            assert res_overview.status_code == 200
            overview_data = res_overview.json()
            assert overview_data["total_memories"] >= 1
            assert "recent_memories" in overview_data

            # 8. Developer Feedback (/hindsight/feedback)
            res_feedback = test_client.post(
                f"/api/repos/{sid}/hindsight/feedback",
                json={
                    "recommendation_id": "rec_test_123",
                    "description": "Accepted impact recommendation for auth module",
                    "outcome": "ACCEPTED",
                    "node_id": "file:auth.py",
                },
            )
            assert res_feedback.status_code == 200
            assert res_feedback.json()["status"] in ("retained_locally", "retained")
    finally:
        import app.api.routes as routes
        routes._STORE = None
        store.close()
        if db_file.exists():
            try:
                db_file.unlink()
            except OSError:
                pass


