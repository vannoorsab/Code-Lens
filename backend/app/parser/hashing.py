from __future__ import annotations

import hashlib


def source_hash(source: bytes) -> str:
    """Hash source independent of the platform's newline convention."""
    normalized = source.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(normalized).hexdigest()
