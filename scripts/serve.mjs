// Tiny static server for local preview and proof capture: node scripts/serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ics': 'text/calendar; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

export function startServer({ port = 8080, root = path.join(ROOT, 'dist') } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
    let status = 200;
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { file = path.join(root, '404.html'); status = 404; }
    res.writeHead(status, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? process.env.PORT ?? 8080);
  const server = await startServer({ port });
  console.log(`Serving dist/ at http://127.0.0.1:${server.address().port}/ (Ctrl+C to stop)`);
}
