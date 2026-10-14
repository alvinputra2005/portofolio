import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const args = process.argv.slice(2);
let requestedPort = process.env.PORT || "3000";

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--port") {
    requestedPort = args[++index];
  } else if (arg.startsWith("--port=")) {
    requestedPort = arg.slice("--port=".length);
  } else {
    console.error(`Argumen tidak dikenal: ${arg}. Gunakan --port 3000.`);
    process.exit(1);
  }
}

if (!/^\d+$/.test(requestedPort ?? "")) {
  console.error("Port harus berupa bilangan bulat antara 1 dan 65535.");
  process.exit(1);
}

const port = Number(requestedPort);
if (port < 1 || port > 65535) {
  console.error("Port harus berupa bilangan bulat antara 1 dan 65535.");
  process.exit(1);
}

let root;
try {
  root = await realpath(fileURLToPath(new URL("../out", import.meta.url)));
  if (!(await stat(root)).isDirectory()) throw new Error("out bukan direktori");
} catch {
  console.error("Folder out belum tersedia. Jalankan npm run build terlebih dahulu.");
  process.exit(1);
}

const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".webm": "video/webm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function isInsideRoot(path) {
  const remainder = relative(root, path);
  return remainder !== ".." && !remainder.startsWith(`..${sep}`) && !isAbsolute(remainder);
}

async function getFile(path) {
  if (!isInsideRoot(path)) return null;
  try {
    let resolvedPath = await realpath(path);
    if (!isInsideRoot(resolvedPath)) return null;
    let info = await stat(resolvedPath);
    if (info.isDirectory()) {
      resolvedPath = await realpath(resolve(resolvedPath, "index.html"));
      if (!isInsideRoot(resolvedPath)) return null;
      info = await stat(resolvedPath);
    }
    return info.isFile() ? { path: resolvedPath, size: info.size } : null;
  } catch (error) {
    if (["ENOENT", "ENOTDIR", "EACCES", "EPERM"].includes(error.code)) return null;
    throw error;
  }
}

function sendText(request, response, status, message) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(message),
    "X-Content-Type-Options": "nosniff",
  });
  response.end(request.method === "HEAD" ? undefined : message);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    sendText(request, response, 405, "Method not allowed\n");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
    if (pathname.includes("\0")) throw new Error("Invalid path");
    pathname = pathname.replaceAll("\\", "/");
  } catch {
    sendText(request, response, 400, "Invalid request path\n");
    return;
  }

  const candidate = resolve(root, pathname.slice(1));
  if (!isInsideRoot(candidate)) {
    sendText(request, response, 403, "Forbidden\n");
    return;
  }

  try {
    let file = await getFile(candidate);
    const status = file ? 200 : 404;
    if (!file) file = await getFile(resolve(root, "404.html"));
    if (!file) {
      sendText(request, response, 404, "Page not found\n");
      return;
    }

    response.writeHead(status, {
      "Content-Type": mimeTypes[extname(file.path).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": file.size,
      "Cache-Control": status === 200 && pathname.startsWith("/_next/static/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }
    await pipeline(createReadStream(file.path), response);
  } catch (error) {
    if (error.code === "ERR_STREAM_PREMATURE_CLOSE" || error.code === "ECONNRESET") return;
    console.error("Gagal menyajikan file:", error.message);
    if (!response.headersSent) sendText(request, response, 500, "Internal server error\n");
    else response.destroy();
  }
});

server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE"
    ? `Port ${port} sedang digunakan. Coba npm run preview -- --port 3001.`
    : `Preview gagal: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Preview portofolio: http://${host}:${port}`);
  console.log("Tekan Ctrl+C untuk menghentikan server.");
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nMenghentikan preview...");
  server.close(() => {
    clearTimeout(deadline);
    process.exitCode = 0;
  });
  server.closeIdleConnections();
  const deadline = setTimeout(() => server.closeAllConnections(), 5000);
  deadline.unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
