import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { initSocketServer } from "./config/socket.js";

const PORT = process.env.PORT || 5000;
const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO Server
initSocketServer(server);

// Start Server and Database Connection
async function startServer() {
  try {
    console.log("[Server] Initializing Harmony Society Backend...");
    
    // Attempt DB connection (handles retry or local fallback)
    try {
      await connectDatabase();
    } catch (dbErr) {
      console.warn("[Server] MongoDB connection attempt failed. Continuing in offline mode if needed:", dbErr.message);
    }

    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  HARMONY SOCIETY BACKEND RUNNING ON PORT ${PORT}`);
      console.log(`  REST API:   http://localhost:${PORT}/api/v1`);
      console.log(`  Healthcheck: http://localhost:${PORT}/api/v1/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error("[Server] Fatal startup error:", error);
    process.exit(1);
  }
}

// Graceful Shutdown
async function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log("[Server] HTTP server closed.");
    try {
      await disconnectDatabase();
      console.log("[Server] Database connection closed.");
    } catch (err) {
      console.error("[Server] Error closing database:", err);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
  process.exit(1);
});

startServer();
