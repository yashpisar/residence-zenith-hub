import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export function initSocketServer(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((origin) => origin.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    const societyId = socket.handshake.auth?.societyId || socket.handshake.headers?.["x-society-id"];

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "harmony_jwt_access_secret_key_change_in_production_89412");
      socket.user = decoded;
      socket.societyId = societyId;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role, flatId } = socket.user;
    const societyId = socket.societyId;

    console.log(`[Socket] User ${userId} (${role}) connected. Socket ID: ${socket.id}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join society room if specified
    if (societyId) {
      socket.join(`society:${societyId}`);

      // Role-specific rooms within the society
      if (role === "security") {
        socket.join(`guards:${societyId}`);
      } else if (role === "secretary" || role === "superadmin") {
        socket.join(`secretaries:${societyId}`);
      }
    }

    // Join flat room if resident
    if (flatId) {
      socket.join(`flat:${flatId}`);
    }

    // Dynamic room subscription request (with authorization verification)
    socket.on("subscribe:society", (newSocietyId) => {
      // Allow joining only if user belongs to this society or is superadmin
      if (socket.user.societyId === newSocietyId || socket.user.role === "superadmin") {
        socket.join(`society:${newSocietyId}`);
        socket.societyId = newSocietyId;
        console.log(`[Socket] Socket ${socket.id} joined society:${newSocietyId}`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Socket ${socket.id} disconnected: ${reason}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
}

// Helper Emitters
export function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToSociety(societyId, event, data) {
  if (io) {
    io.to(`society:${societyId}`).emit(event, data);
  }
}

export function emitToFlat(flatId, event, data) {
  if (io) {
    io.to(`flat:${flatId}`).emit(event, data);
  }
}

export function emitToGuards(societyId, event, data) {
  if (io) {
    io.to(`guards:${societyId}`).emit(event, data);
  }
}

export function emitToSecretaries(societyId, event, data) {
  if (io) {
    io.to(`secretaries:${societyId}`).emit(event, data);
  }
}
