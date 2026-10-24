import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import { errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/response.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import societyRoutes from "./routes/societyRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

export function createApp() {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS Configuration
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps or curl) or in allowed list
        if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Dev-friendly permissive for local dev tunnels
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Society-Id", "x-society-id"],
    })
  );

  // Body Parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // Healthcheck Endpoint
  app.get("/api/v1/health", (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    return sendSuccess(res, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
    }, "Harmony Society API is running smoothly");
  });

  // REST API Route Mounts
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/societies", societyRoutes);
  app.use("/api/v1/complaints", complaintRoutes);
  app.use("/api/v1/files", fileRoutes);
  app.use("/api/v1/visitors", visitorRoutes);
  app.use("/api/v1", financeRoutes);
  app.use("/api/v1", communityRoutes);

  // 404 Not Found Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
