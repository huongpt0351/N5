import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const requestedPath = path.resolve(projectRoot, `.${pathname}`);
  if (requestedPath !== projectRoot && !requestedPath.startsWith(`${projectRoot}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  const filePath = pathname === '/' ? path.join(projectRoot, 'index.html') : requestedPath;
  try {
    const canonicalPath = await realpath(filePath);
    if (canonicalPath !== projectRoot && !canonicalPath.startsWith(`${projectRoot}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(canonicalPath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(canonicalPath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    }).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(4173, '127.0.0.1', () => {
  process.stdout.write('N5 app available at http://localhost:4173\n');
});
