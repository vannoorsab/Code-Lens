"""CODE-LENS Experience Engine.

Translates CODE-LENS events (commit milestones, architecture decisions, code reviews,
change outcomes, developer feedback) into structured ExperienceMemory objects and
retains/recalls/reflects them via HindsightMemoryProvider.
"""

from __future__ import annotations

import logging
from typing import Any

from app.semantic.hindsight import get_hindsight_provider
from app.semantic.memory_models import (
    ExperienceMemory,
    MemoryCategory,
    MemoryQuery,
    MemoryReflectContext,
    RecallResult,
    ReflectResult,
    RetainResult,
)

logger = logging.getLogger(__name__)


def retain_experience(
    category: MemoryCategory | str,
    repository: str,
    description: str,
    *,
    component: str | None = None,
    related_files: list[str] | None = None,
    outcome: str | None = None,
    commit_sha: str | None = None,
    branch: str | None = None,
    author: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> RetainResult:
    """Step 5 (RETAIN): Create and store a structured experience memory in Hindsight."""
    if isinstance(category, str):
        try:
            category_enum = MemoryCategory(category)
        except ValueError:
            category_enum = MemoryCategory.CODE_REVIEW
    else:
        category_enum = category

    memory = ExperienceMemory(
        category=category_enum,
        repository=repository,
        component=component,
        related_files=related_files or [],
        description=description,
        outcome=outcome,
        commit_sha=commit_sha,
        branch=branch,
        author=author,
        tags=tags or [],
        metadata=metadata or {},
    )

    provider = get_hindsight_provider()
    result = provider.retain(memory)
    logger.info("Experience retained [category=%s, repo=%s, status=%s]", category_enum.value, repository, result.status)
    return result


def recall_experiences(
    repository: str,
    query_text: str,
    *,
    component: str | None = None,
    files: list[str] | None = None,
    affected_symbols: list[str] | None = None,
    tags: list[str] | None = None,
    limit: int = 5,
) -> RecallResult:
    """Step 6 (RECALL): Retrieve relevant historical experiences from Hindsight."""
    query = MemoryQuery(
        repository=repository,
        query_text=query_text,
        component=component,
        files=files or [],
        affected_symbols=affected_symbols or [],
        tags=tags or [],
        limit=limit,
    )

    provider = get_hindsight_provider()
    return provider.recall(query)


def reflect_on_experience(
    repository: str,
    query_text: str,
    *,
    current_code_evidence: list[dict[str, Any]] | None = None,
    historical_memories: list[ExperienceMemory] | None = None,
    component: str | None = None,
) -> ReflectResult:
    """Step 7 (REFLECT): Perform agentic reflection over graph facts + memories."""
    # If historical_memories not explicitly provided, recall them first
    if historical_memories is None:
        recalled = recall_experiences(
            repository=repository,
            query_text=query_text,
            component=component,
            limit=5,
        )
        historical_memories = recalled.memories

    context = MemoryReflectContext(
        repository=repository,
        query_text=query_text,
        current_code_evidence=current_code_evidence or [],
        historical_memories=historical_memories,
        component=component,
    )

    provider = get_hindsight_provider()
    return provider.reflect(context)
