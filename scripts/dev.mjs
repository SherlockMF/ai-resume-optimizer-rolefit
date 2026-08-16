/**
 * 开发服务器启动：从首选端口起自动找空端口，避免 3000/3001/3002 占用时手动改端口。
 * 用法: npm run dev
 * 固定端口: npm run dev:3002  或  PORT=3005 npm run dev
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const cliPort = process.argv[2];
const PREFERRED = cliPort
  ? Number(cliPort)
  : Number(process.env.PORT) || 3000;
const PORT_MAX = 3010;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(start) {
  for (let port = start; port <= PORT_MAX; port++) {
    if (await checkPort(port)) return port;
  }
  throw new Error(
    `在 ${start}–${PORT_MAX} 范围内没有可用端口。请先结束占用端口的进程，或设置 PORT=3011 npm run dev`,
  );
}

function printBanner(port, switched) {
  const url = `http://localhost:${port}`;
  const lines = [
    "",
    "  ┌─────────────────────────────────────────────┐",
    "  │  转行简历 AI · 开发服务器                    │",
    "  ├─────────────────────────────────────────────┤",
    `  │  ${url.padEnd(43)}│`,
  ];
  if (switched) {
    lines.push(
      `  │  （${PREFERRED} 已被占用，已自动使用 ${port}）`.padEnd(46) + "│",
    );
  }
  lines.push(
    "  └─────────────────────────────────────────────┘",
    "",
  );
  console.log(lines.join("\n"));
}

const lockPath = path.join(root, ".next", "dev", "lock");
if (fs.existsSync(lockPath)) {
  console.log("检测到残留 Next 开发锁，正在清理 3000–3010 端口…\n");
  await new Promise((resolve, reject) => {
    const killer = spawn(process.execPath, [path.join(__dirname, "kill-dev-ports.mjs")], {
      cwd: root,
      stdio: "inherit",
    });
    killer.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("dev:kill failed"))));
  });
}

const port = await findAvailablePort(PREFERRED);
const switched = port !== PREFERRED;

printBanner(port, switched);

const childEnv = { ...process.env, PORT: String(port) };
// Node 22+：让 fetch 遵循 HTTP(S)_PROXY，避免 Clash Fake-IP 直连 198.18.* 出现 EACCES
if (
  !childEnv.NODE_USE_ENV_PROXY &&
  (childEnv.HTTP_PROXY || childEnv.HTTPS_PROXY || childEnv.http_proxy || childEnv.https_proxy)
) {
  childEnv.NODE_USE_ENV_PROXY = "1";
  console.log("已启用 NODE_USE_ENV_PROXY=1（检测到系统代理）\n");
}

const child = spawn(
  process.execPath,
  [nextBin, "dev", "--port", String(port), "--hostname", "127.0.0.1"],
  {
    cwd: root,
    stdio: "inherit",
    env: childEnv,
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
