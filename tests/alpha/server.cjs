const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../alpha-public');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };

http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (requestPath === '/alpha/__owl/analytics') {
    response.writeHead(204); response.end(); return;
  }
  if (requestPath === '/favicon.ico') {
    response.writeHead(204); response.end(); return;
  }
  const relative = requestPath === '/alpha/' || requestPath === '/alpha' ? 'alpha/index.html' : requestPath.replace(/^\//, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(4175, '127.0.0.1');
