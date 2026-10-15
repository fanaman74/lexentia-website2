import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp4':'video/mp4' };
const server = http.createServer((req, res) => { const requestPath = decodeURIComponent((req.url || '/').split('?')[0]); const safe = path.normalize(requestPath === '/' ? '/index.html' : requestPath); const file = path.join(root, safe); if (!file.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; } fs.readFile(file, (error, data) => { if (error) { res.writeHead(404); res.end('Not found'); return; } res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data); }); });
server.listen(port, '127.0.0.1', () => console.log(`Lexentia preview running at http://127.0.0.1:${port}`));
