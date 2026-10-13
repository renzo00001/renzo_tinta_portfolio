/* Local static preview, bound to this computer only. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
http.createServer((request, response) => {
  let name;
  try { name = decodeURIComponent(request.url.split('?')[0]); }
  catch { response.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
    response.setHeader('Content-Type', type[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  });
}).listen(4173, '127.0.0.1', () => console.log('Portfolio preview: http://127.0.0.1:4173'));
