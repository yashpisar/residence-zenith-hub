import { io, Socket } from "socket.io-client";

// This is a simulated socket service for frontend demonstration since we don't have a backend.
// In a real scenario, this would connect to the backend socket endpoint.
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();
  private mockDelay = 800; // Simulated network delay

  private currentSocietyId: string | null = null;

  connect(token: string, societyId: string) {
    if (this.socket) {
      if (this.currentSocietyId !== societyId) {
        this.disconnect();
      } else {
        return;
      }
    }
    
    this.currentSocietyId = societyId;
    
    // In a real app:
    // this.socket = io("https://api.yourdomain.com", {
    //   auth: { token, societyId },
    //   autoConnect: true,
    // });
    
    // For our mock, we just simulate the connection and event emitter
    console.log(`[Socket] Connected to mock server for society ${societyId}`);
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

  // Bind a listener
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Remove a listener
  off(event: string, callback?: (...args: any[]) => void) {
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

  // Emit an event to the server
  emit(event: string, data: any) {
    const payload = { ...data, societyId: this.currentSocietyId };
    console.log(`[Socket] Emitting ${event}:`, payload);
    
    // We mock the backend's response here for demonstration purposes.
    setTimeout(() => {
      this.simulateBackendProcessing(event, payload);
    }, this.mockDelay);
  }

  // --- MOCK BACKEND LOGIC ---
  private simulateBackendProcessing(event: string, data: any) {
    switch (event) {
      case "visitor_approval_request":
        // The security guard requests approval.
        // We broadcast this to the resident (simulated by triggering the listener locally).
        this.triggerLocalEvent("visitor_approval_request", {
          id: Math.random().toString(36).substr(2, 9),
          ...data,
          timestamp: new Date().toISOString(),
        });
        break;
        
      case "visitor_approval_response":
        // Resident approved/rejected.
        // We broadcast this back to the security guard.
        if (data.status === "approved") {
          this.triggerLocalEvent("visitor_approved", data);
        } else {
          this.triggerLocalEvent("visitor_rejected", data);
        }
        break;

      case "visitor_checked_in":
        this.triggerLocalEvent("visitor_status_changed", { ...data, status: "Inside Society", timestamp: new Date().toISOString() });
        break;

      case "visitor_checked_out":
        this.triggerLocalEvent("visitor_status_changed", { ...data, status: "Exited", timestamp: new Date().toISOString() });
        break;

      case "emergency":
        // Alert secretary and broadcast to guard
        this.triggerLocalEvent("emergency_alert", {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
        });
        break;

      case "complaint_created":
        this.triggerLocalEvent("new_complaint", {
          ...data,
          status: "Pending",
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }

  // Internal method to trigger listeners (simulating receiving an event from server)
  public triggerLocalEvent(event: string, data: any) {
    console.log(`[Socket] Receiving ${event}:`, data);
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => cb(data));
    }
  }
}

export const socketService = new SocketService();
