/**
 * Generic WebSocket hook with automatic reconnect.
 * Used by judge and secretary views to receive live push events.
 */
import { useEffect, useRef, useCallback } from "react";
import type { WsMessage } from "../types";

const WS_BASE = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}`;
const RECONNECT_DELAY_MS = 3000;

type Handler = (msg: WsMessage) => void;

export function useWebSocket(channel: string, token: string, onMessage: Handler) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const url = `${WS_BASE}/ws/${channel}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log(`[WS] Connected to channel: ${channel}`);
    };

    socket.onmessage = (evt) => {
      try {
        const msg: WsMessage = JSON.parse(evt.data);
        onMessageRef.current(msg);
      } catch {
        console.warn("[WS] Failed to parse message", evt.data);
      }
    };

    socket.onclose = () => {
      console.warn(`[WS] Disconnected from ${channel}, reconnecting in ${RECONNECT_DELAY_MS}ms`);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    socket.onerror = (err) => {
      console.error("[WS] Error:", err);
      socket.close();
    };
  }, [channel, token]);

  useEffect(() => {
    if (!token) return;
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect, token]);

  const send = useCallback((data: object) => {
    ws.current?.readyState === WebSocket.OPEN && ws.current.send(JSON.stringify(data));
  }, []);

  return { send };
}
