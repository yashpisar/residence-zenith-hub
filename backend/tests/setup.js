import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongoServer;

export async function setupTestDB() {
  process.env.MONGOMS_MD5_CHECK = "0";

  const localBinary = path.resolve(
    __dirname,
    "../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe"
  );

  const opts = {
    binary: {
      checkMD5: false,
    },
  };

  if (fs.existsSync(localBinary)) {
    opts.binary.systemBinary = localBinary;
  }

  mongoServer = await MongoMemoryServer.create(opts);
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
