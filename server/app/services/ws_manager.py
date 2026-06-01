"""
WebSocket connection manager.

Channels:
  marshal/{user_id}  — unicast to a specific marshal
  judge              — broadcast to all connected judges
  secretary          — broadcast to all connected secretaries
  admin              — broadcast to all connected admins
  emergency          — broadcast to ALL connected clients

All messages are JSON-serialisable dicts with at minimum:
  { "event": "<event_name>", "payload": { ... } }
"""
import json
import logging
from collections import defaultdict
from typing import Literal

from fastapi import WebSocket

logger = logging.getLogger(__name__)

Channel = Literal["marshal", "judge", "secretary", "admin"]


class ConnectionManager:
    def __init__(self) -> None:
        # marshal connections keyed by user_id
        self._marshals: dict[int, list[WebSocket]] = defaultdict(list)
        # role-based broadcast channels
        self._channels: dict[str, list[WebSocket]] = defaultdict(list)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect_marshal(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        self._marshals[user_id].append(websocket)
        logger.info("Marshal %d connected (total connections: %d)", user_id, len(self._marshals[user_id]))

    async def connect_role(self, websocket: WebSocket, channel: str) -> None:
        await websocket.accept()
        self._channels[channel].append(websocket)
        logger.info("Client connected to channel '%s'", channel)

    def disconnect_marshal(self, websocket: WebSocket, user_id: int) -> None:
        try:
            self._marshals[user_id].remove(websocket)
        except ValueError:
            pass
        logger.info("Marshal %d disconnected", user_id)

    def disconnect_role(self, websocket: WebSocket, channel: str) -> None:
        try:
            self._channels[channel].remove(websocket)
        except ValueError:
            pass
        logger.info("Client disconnected from channel '%s'", channel)

    # ------------------------------------------------------------------
    # Sending
    # ------------------------------------------------------------------

    async def send_to_marshal(self, user_id: int, event: str, payload: dict) -> None:
        message = json.dumps({"event": event, "payload": payload})
        dead: list[WebSocket] = []
        for ws in self._marshals.get(user_id, []):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_marshal(ws, user_id)

    async def broadcast_to_channel(self, channel: str, event: str, payload: dict) -> None:
        message = json.dumps({"event": event, "payload": payload})
        dead: list[WebSocket] = []
        for ws in self._channels.get(channel, []):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_role(ws, channel)

    async def broadcast_emergency(self, event: str, payload: dict) -> None:
        """Deliver to every connected client regardless of channel."""
        message = json.dumps({"event": event, "payload": payload})
        all_sockets: list[WebSocket] = []
        for sockets in self._marshals.values():
            all_sockets.extend(sockets)
        for sockets in self._channels.values():
            all_sockets.extend(sockets)
        for ws in all_sockets:
            try:
                await ws.send_text(message)
            except Exception:
                pass  # best-effort for emergency; no cleanup needed here


# Application-scoped singleton
manager = ConnectionManager()
