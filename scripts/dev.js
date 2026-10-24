import { spawn } from "child_process";
import path from "path";
import process from "process";

const rootDir = process.cwd();
const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\n=======================================================");
console.log("  STARTING HARMONY SOCIETY FULL-STACK (DEV MODE)");
console.log("  Frontend: React 19 + TanStack Router (Vite)");
console.log("  Backend:  Node.js + Express + MongoDB (Port 5000)");
console.log("=======================================================\n");

function runService(name, dir, script, prefixColor) {
  const child = spawn(npmCmd, ["run", script], {
    cwd: path.join(rootDir, dir),
    shell: isWindows,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${prefixColor}[${name}]\x1b[0m ${line}`);
      }
    }
  });

  child.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${prefixColor}[${name} ERR]\x1b[0m ${line}`);
      }
    }
  });

  child.on("close", (code) => {
    console.log(`${prefixColor}[${name}]\x1b[0m Exited with code ${code}`);
  });

  return child;
}

// Cyan for Backend (\x1b[36m), Green for Frontend (\x1b[32m)
const backend = runService("BACKEND", "backend", "dev", "\x1b[36m");
const frontend = runService("FRONTEND", "frontend", "dev", "\x1b[32m");

function shutdown() {
  console.log("\n[Dev Orchestrator] Stopping frontend and backend services...");
  try {
    if (isWindows) {
      if (backend.pid) spawn("taskkill", ["/pid", backend.pid, "/f", "/t"]);
      if (frontend.pid) spawn("taskkill", ["/pid", frontend.pid, "/f", "/t"]);
    } else {
      backend.kill("SIGTERM");
      frontend.kill("SIGTERM");
    }
  } catch (e) {
    // ignore
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
