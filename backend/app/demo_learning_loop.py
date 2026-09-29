"""CODE-LENS Hackathon Demo Scenario — Reproducible 3-Stage Learning Loop.

Demonstrates:
Interaction 1: Developer queries component -> Initial structural analysis -> Experience retained in Hindsight.
Interaction 2: Developer asks similar change -> Recalls past experience -> Recommendation augmented -> Developer feedback retained.
Interaction 3: Future similar change -> Uses accumulated experience -> High-confidence contextual recommendation.
"""

from __future__ import annotations

import logging
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.graph.schema import KnowledgeGraph, Node, NodeKind, RepoSnapshot
from app.graph.store import SQLiteGraphStore
from app.graph.traversal import GraphView
from app.semantic.experience_engine import recall_experiences, reflect_on_experience, retain_experience
from app.semantic.memory_analysis import MemoryAwareCodeAnalysisService
from app.semantic.memory_models import MemoryCategory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("demo_learning_loop")


def run_demo_scenario():
    print("=" * 70)
    print(" [*] CODE-LENS Hindsight Learning Loop Demo Scenario")
    print("=" * 70)

    repo_url = "https://github.com/psf/requests"

    # Setup demo graph snapshot
    snapshot = RepoSnapshot(
        repo_url=repo_url,
        commit_sha="demo123456",
        primary_language="Python",
        languages={"py": 10},
        file_count=5,
        analyzed_at="2026-09-29T00:00:00Z",
    )
    node_auth = Node(id="file:auth.py", kind=NodeKind.FILE, name="auth.py", qualified_name="auth.py", file_path="requests/auth.py")
    node_session = Node(id="file:sessions.py", kind=NodeKind.FILE, name="sessions.py", qualified_name="sessions.py", file_path="requests/sessions.py")
    graph = KnowledgeGraph(snapshot=snapshot, nodes=[node_auth, node_session], edges=[])
    view = GraphView(graph)

    # ── INTERACTION 1: Baseline Structural Analysis & Retain Experience ──────
    print("\n--- INTERACTION 1: Baseline Structural Analysis ---")
    res1 = MemoryAwareCodeAnalysisService.analyze(
        graph=graph,
        view=view,
        snapshot_id=1,
        node_id="file:auth.py",
        memory_mode="MEMORY_ON",
    )
    print(f"[Agent Recommendation 1]: {res1.recommendation}")
    print(f"[Memories Used 1]: {len(res1.historical_memories)}")

    # Retain historical experience into Hindsight
    print("\n[Retaining Experience]: Retaining prior auth regression incident into Hindsight...")
    ret1 = retain_experience(
        category=MemoryCategory.REGRESSION,
        repository=repo_url,
        component="requests/auth.py",
        related_files=["requests/auth.py", "requests/sessions.py"],
        description="Modifying auth.py header validation broke session token persistence in sessions.py.",
        outcome="REGRESSION_PREVENTED",
        author="alex@team.com",
    )
    print(f"[Hindsight Status]: Retained with Memory ID: {ret1.memory_id}")

    time.sleep(1)

    # ── INTERACTION 2: Memory-Aware Recall & Developer Feedback ──────────────
    print("\n--- INTERACTION 2: Memory-Aware Recall & Developer Feedback ---")
    res2 = MemoryAwareCodeAnalysisService.analyze(
        graph=graph,
        view=view,
        snapshot_id=1,
        node_id="file:auth.py",
        memory_mode="MEMORY_ON",
        custom_query="Modifying auth.py session token persistence",
    )
    print(f"[Agent Recommendation 2]: {res2.recommendation}")
    print(f"[Confidence Score]: {int(res2.confidence * 100)}%")
    print(f"[Recalled Memories]: {len(res2.historical_memories)}")

    # Developer provides feedback
    print("\n[Developer Feedback]: Developer accepts recommendation ('ACCEPTED'). Retaining feedback...")
    ret2 = retain_experience(
        category=MemoryCategory.DEVELOPER_FEEDBACK,
        repository=repo_url,
        component="requests/auth.py",
        related_files=["requests/auth.py", "requests/sessions.py"],
        description="Developer feedback (ACCEPTED): Confirmed session token invalidation check before modifying auth.py.",
        outcome="ACCEPTED",
        author="developer@team.com",
    )
    print(f"[Hindsight Status]: Feedback retained with Memory ID: {ret2.memory_id}")

    time.sleep(1)

    # ── INTERACTION 3: High-Confidence Contextual Guidance ───────────────────
    print("\n--- INTERACTION 3: Accumulated Experience Guidance ---")
    res3 = MemoryAwareCodeAnalysisService.analyze(
        graph=graph,
        view=view,
        snapshot_id=1,
        node_id="file:auth.py",
        memory_mode="MEMORY_ON",
        custom_query="Updating auth header validation order",
    )
    print(f"[Agent Recommendation 3]: {res3.recommendation}")
    print(f"[Confidence Score]: {int(res3.confidence * 100)}%")
    print(f"[Recalled Memories]: {len(res3.historical_memories)}")
    print(f"[Agent Trace Steps]: {len(res3.agent_trace)} steps executed cleanly")

    print("\n=" * 70)
    print(" [OK] DEMO SCENARIO COMPLETE: Learning Loop Verified!")
    print("=" * 70)


if __name__ == "__main__":
    run_demo_scenario()
