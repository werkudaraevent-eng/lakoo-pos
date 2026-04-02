import { spawn } from "node:child_process";

const children = new Set();

function startProcess(name, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);

    if (signal) {
      shutdown(1);
      return;
    }

    if (code && code !== 0) {
      shutdown(code);
    }
  });

  child.on("error", (error) => {
    console.error(`[dev:${name}] ${error.message}`);
    shutdown(1);
  });

  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // Ignore child shutdown races.
    }
  }

  setTimeout(() => {
    for (const child of children) {
      try {
        child.kill("SIGKILL");
      } catch {
        // Ignore child shutdown races.
      }
    }
  }, 1500).unref();

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startProcess("server", process.execPath, ["server/index.js"]);
startProcess("client", process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"]);
