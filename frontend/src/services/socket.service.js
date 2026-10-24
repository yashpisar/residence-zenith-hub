import { io } from "socket.io-client";

class SocketService {
  socket = null;
  listeners = new Map();
  currentSocietyId = null;

  connect(token, societyId) {
    if (this.socket && this.socket.connected) {
      if (this.currentSocietyId === societyId) {
        return;
      }
      this.disconnect();
    }

    this.currentSocietyId = societyId;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    try {
      this.socket = io(socketUrl, {
        auth: { token, societyId },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log(`[Socket] Connected to real-time server for society: ${societyId}`);
      });

      this.socket.on("connect_error", (err) => {
        console.warn("[Socket] Real-time connection notice (backend may be offline or starting):", err.message);
      });

      // Forward all incoming socket events to registered listeners
      this.socket.onAny((event, ...args) => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.forEach((callback) => {
            try {
              callback(...args);
            } catch (err) {
              console.error(`[Socket] Error in listener for ${event}:`, err);
            }
          });
        }
      });
    } catch (e) {
      console.warn("[Socket] Could not initialize socket connection:", e);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentSocietyId = null;
    this.listeners.clear();
    console.log("[Socket] Disconnected");
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(
        event,
        handlers.filter((cb) => cb !== callback)
      );
    }
  }

  emit(event, data) {
    const payload = { ...data, societyId: this.currentSocietyId };
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, payload);
    } else {
      console.log(`[Socket] Emitting locally (socket offline): ${event}`, payload);
      // Fallback local trigger
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.forEach((cb) => cb(payload));
      }
    }
  }
}

export const socketService = new SocketService();
