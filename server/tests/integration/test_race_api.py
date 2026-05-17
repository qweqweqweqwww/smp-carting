"""
Integration tests for race CRUD endpoints.
Uses an in-memory SQLite database.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.database import init_db, engine, Base


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_create_and_list_race(client):
    async with client as c:
        resp = await c.post("/api/v1/races/", json={
            "name": "Test Race",
            "venue": "Test Kart Arena",
            "scheduled_at": "2025-06-01T10:00:00Z",
        })
        assert resp.status_code == 201
        race_id = resp.json()["id"]

        resp = await c.get("/api/v1/races/")
        assert resp.status_code == 200
        assert any(r["id"] == race_id for r in resp.json())


@pytest.mark.asyncio
async def test_start_race(client):
    async with client as c:
        resp = await c.post("/api/v1/races/", json={
            "name": "Race Start Test",
            "venue": "Arena",
            "scheduled_at": "2025-06-01T10:00:00Z",
        })
        race_id = resp.json()["id"]

        resp = await c.post(f"/api/v1/races/{race_id}/start")
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"
