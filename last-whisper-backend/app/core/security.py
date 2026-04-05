"""Rate limiting helpers."""

from __future__ import annotations

from collections import defaultdict, deque
from functools import lru_cache
from threading import Lock
from time import monotonic
from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings
from app.services.exceptions import RateLimitExceeded


class RateLimiter:
    """Simple in-memory sliding-window rate limiter."""

    def __init__(self):
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        window_start = now - window_seconds

        with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] <= window_start:
                bucket.popleft()

            if len(bucket) >= limit:
                raise RateLimitExceeded("Rate limit exceeded")

            bucket.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


@lru_cache
def get_rate_limiter() -> RateLimiter:
    return RateLimiter()


def request_identity(request: Request) -> str:
    """Return the client IP for rate-limiting identity."""
    return request.client.host if request.client else "anonymous"


def rate_limit_dependency(
    bucket: str,
    *,
    limit: Optional[int] = None,
    window_seconds: Optional[int] = None,
) -> Callable:
    """Return a FastAPI dependency enforcing a rate limit per identity."""

    async def _dependency(identity: str = Depends(request_identity)) -> None:
        rate_limit = limit or settings.api_rate_limit_per_minute
        window = window_seconds or settings.api_rate_limit_window_seconds
        limiter = get_rate_limiter()
        try:
            limiter.hit(f"{bucket}:{identity}", rate_limit, window)
        except RateLimitExceeded as exc:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=exc.message,
            ) from exc

    return _dependency


def reset_rate_limiter_state() -> None:
    """Helper for tests to clear rate limiter buckets."""

    get_rate_limiter().reset()
