"""
WebSocket endpoints for judge, secretary, and admin channels.
Channel: ws://server/ws/{channel}?token={session_token}

Valid channels: judge | secretary | admin

Events received (any channel):
  - heartbeat        { type: "heartbeat" }

Events pushed to judge:
  - incident.new     { incident_id, pilot_numbers, violation_type, ... }
  - incident.updated { incident_id, status }

Events pushed to secretary:
  - protocol.new     { sequence_number, pilot_numbers, decision_type, ... }

Events pushed to admin:
  - race.status_changed { race_id, status }
"""
import logging
from typing import Literal

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.services.ws_manager import manager

router = APIRouter()
logger = logging.getLogger(__name__)

ROLE_CHANNEL_MAP: dict[str, str] = {
    UserRole.JUDGE: "judge",
    UserRole.SECRETARY: "secretary",
    UserRole.ADMIN: "admin",
}


@router.websocket("/ws/{channel}")
async def role_ws(
    websocket: WebSocket,
    channel: Literal["judge", "secretary", "admin"],
    token: str = "",
):
    # Validate token and confirm role matches channel
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.session_token == token))
        user = result.scalar_one_or_none()

    if not user or ROLE_CHANNEL_MAP.get(user.role) != channel:
        await websocket.close(code=4001, reason="Unauthorized or wrong channel")
        return

    await manager.connect_role(websocket, channel)
    await websocket.send_json({
        "event": "connected",
        "payload": {"user_id": user.id, "channel": channel, "race_id": user.race_id},
    })

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "heartbeat":
                await websocket.send_json({"event": "heartbeat.ack", "payload": {}})
    except WebSocketDisconnect:
        manager.disconnect_role(websocket, channel)
        logger.info("User %d disconnected from channel '%s'", user.id, channel)
