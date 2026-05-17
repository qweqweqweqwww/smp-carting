"""
WebSocket endpoint for marshal devices.
Channel: ws://server/ws/marshal/{marshal_id}?token={session_token}

Events received from marshal:
  - heartbeat        { type: "heartbeat" }

Events sent to marshal:
  - connected        { user_id, race_id }
  - incident.ack     { incident_id, status }
  - error            { message }
"""
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.services.ws_manager import manager
from sqlalchemy import select

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/marshal/{marshal_id}")
async def marshal_ws(websocket: WebSocket, marshal_id: int, token: str = ""):
    # Validate session token
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == marshal_id))
        user = result.scalar_one_or_none()

    if not user or user.session_token != token:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await manager.connect_marshal(websocket, marshal_id)
    await websocket.send_json({
        "event": "connected",
        "payload": {"user_id": marshal_id, "race_id": user.race_id},
    })

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "heartbeat":
                await websocket.send_json({"event": "heartbeat.ack", "payload": {}})
    except WebSocketDisconnect:
        manager.disconnect_marshal(websocket, marshal_id)
        logger.info("Marshal %d disconnected", marshal_id)
