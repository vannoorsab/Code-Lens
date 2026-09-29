"""CODE-LENS Experience Memory Data Models — Step 4 Schema.

Defines internal structures for team experiences before they are retained in or
recalled from Hindsight.
"""

from __future__ import annotations

from enum import Enum
import uuid
from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class MemoryCategory(str, Enum):
    ARCHITECTURE_DECISION = "ARCHITECTURE_DECISION"
    CODE_REVIEW = "CODE_REVIEW"
    CHANGE_OUTCOME = "CHANGE_OUTCOME"
    SUCCESSFUL_FIX = "SUCCESSFUL_FIX"
    FAILED_APPROACH = "FAILED_APPROACH"
    DEVELOPER_FEEDBACK = "DEVELOPER_FEEDBACK"
    TEAM_CONVENTION = "TEAM_CONVENTION"
    REGRESSION = "REGRESSION"


class ExperienceMemory(BaseModel):
    """Structured team experience record in CODE-LENS."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: MemoryCategory
    repository: str
    component: str | None = None
    related_files: list[str] = Field(default_factory=list)
    event_type: str = "general"
    description: str
    outcome: str | None = None  # e.g., "SUCCESS", "REGRESSION", "PASSED_TESTS"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    commit_sha: str | None = None
    branch: str | None = None
    author: str | None = None
    source: str = "codelens"
    tags: list[str] = Field(default_factory=list)
    confidence: float = 1.0
    metadata: dict[str, Any] = Field(default_factory=dict)

    def to_hindsight_content(self) -> str:
        """Format the memory content string for Hindsight indexing."""
        parts = [
            f"[{self.category.value}] [{self.repository}]",
            f"Description: {self.description}",
        ]
        if self.component:
            parts.append(f"Component: {self.component}")
        if self.related_files:
            parts.append(f"Files: {', '.join(self.related_files)}")
        if self.outcome:
            parts.append(f"Outcome: {self.outcome}")
        if self.author:
            parts.append(f"Author: {self.author}")
        return " | ".join(parts)


class MemoryQuery(BaseModel):
    """Input structure for recalling relevant Hindsight memories."""

    repository: str
    query_text: str
    component: str | None = None
    files: list[str] = Field(default_factory=list)
    affected_symbols: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    limit: int = Field(default=5, ge=1, le=50)


class RetainResult(BaseModel):
    """Result payload after retaining an experience in Hindsight."""

    memory_id: str
    status: str
    bank_id: str
    retained_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    detail: str | None = None


class RecallResult(BaseModel):
    """Result payload returning recalled memories and distinct evidence types."""

    query: str
    bank_id: str
    memories: list[ExperienceMemory] = Field(default_factory=list)
    current_code_evidence: list[dict[str, Any]] = Field(default_factory=list)
    historical_memory_evidence: list[dict[str, Any]] = Field(default_factory=list)
    total_recalled: int = 0
    latency_ms: float = 0.0


class MemoryReflectContext(BaseModel):
    """Context payload passed to Hindsight REFLECT stage."""

    repository: str
    query_text: str
    current_code_evidence: list[dict[str, Any]] = Field(default_factory=list)
    historical_memories: list[ExperienceMemory] = Field(default_factory=list)
    component: str | None = None


class ReflectResult(BaseModel):
    """Result payload from Hindsight REFLECT reasoning engine."""

    recommendation: str
    reasoning: str
    current_evidence: list[dict[str, Any]] = Field(default_factory=list)
    historical_evidence: list[dict[str, Any]] = Field(default_factory=list)
    memories_used: list[str] = Field(default_factory=list)
    confidence: float = 1.0
    latency_ms: float = 0.0


class ConnectionHealth(BaseModel):
    """Health & connection status of the Hindsight Memory Provider."""

    connected: bool
    hindsight_enabled: bool
    bank_id: str
    base_url: str
    message: str
    version: str | None = None
    error: str | None = None


class BankStats(BaseModel):
    """Basic statistics for a Hindsight Memory Bank."""

    bank_id: str
    total_memories: int = 0
    active: bool = True
    status: str = "ok"
