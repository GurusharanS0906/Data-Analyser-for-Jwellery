from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.core.config import settings
from app.main import app

TEST_USER_ID = "test-user-1"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    token = jwt.encode(
        {"sub": TEST_USER_ID, "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return {"Authorization": f"Bearer {token}"}
