import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isConnected = false;
let memoryServer = null;

export async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  mongoose.connection.on("connected", () => {
    isConnected = true;
    const masked = (mongoose.connection._connectionString || mongoUri || "")
      .replace(/:([^:@]+)@/, ":****@");
    console.log(`[Database] MongoDB connected successfully to ${masked}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("[Database] MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("[Database] MongoDB disconnected.");
  });

  // 1. Attempt connection with configured MONGODB_URI
  if (mongoUri) {
    try {
      console.log("[Database] Connecting to configured MongoDB URI...");
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 6000,
        autoIndex: process.env.NODE_ENV !== "production",
      });

      // Auto-seed if database is empty
      try {
        const userCount = await mongoose.connection.db.collection("users").countDocuments();
        if (userCount === 0) {
          console.log("[Database] Connected database is empty. Auto-seeding initial demo data...");
          const { runSeed } = await import("../scripts/seed.js");
          await runSeed();
          console.log("[Database] Database auto-seeded successfully with demo accounts!");
        }
      } catch (seedErr) {
        console.warn("[Database] Auto-seed check notice:", seedErr.message);
      }

      return mongoose.connection;
    } catch (error) {
      console.warn("\n=======================================================");
      console.warn("  [Database] ⚠️ MongoDB Atlas connection failed!");
      console.warn(`  Reason: ${error.message}`);
      if (error.message?.includes("bad auth")) {
        console.warn("  -> Atlas rejected the username or password in backend/.env.");
        console.warn("  -> Check MongoDB Atlas -> Database Access -> Database Users.");
      }
      console.warn("=======================================================\n");
    }
  }

  // 2. Fallback to embedded in-memory database in development mode
  if (process.env.NODE_ENV !== "production") {
    try {
      console.log("[Database] Starting embedded in-memory MongoDB for local development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      process.env.MONGOMS_MD5_CHECK = "0";
      const localBinary = path.resolve(
        __dirname,
        "../../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe"
      );
      const opts = { binary: { checkMD5: false } };
      if (fs.existsSync(localBinary)) {
        opts.binary.systemBinary = localBinary;
      }
      memoryServer = await MongoMemoryServer.create(opts);
      const memUri = memoryServer.getUri();

      await mongoose.connect(memUri, {
        dbName: "harmony_society",
        autoIndex: true,
      });

      console.log(`[Database] Embedded in-memory MongoDB running at ${memUri}`);

      // Auto-seed demo accounts into the in-memory database
      try {
        const { runSeed } = await import("../scripts/seed.js");
        if (runSeed) {
          console.log("[Database] Auto-seeding initial demo data into in-memory database...");
          await runSeed();
          console.log("[Database] In-memory database ready with demo accounts!");
        }
      } catch (seedErr) {
        console.warn("[Database] Auto-seed notice:", seedErr.message);
      }

      return mongoose.connection;
    } catch (memErr) {
      console.error("[Database] Failed to start embedded in-memory database:", memErr.message);
    }
  }

  throw new Error(
    "Could not connect to configured MongoDB and embedded database failed to start."
  );
}

export async function disconnectDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
