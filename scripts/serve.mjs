import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const root = resolve('dist');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const target = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const file = resolve(root, `.${decodeURIComponent(target)}`);
    const pathFromRoot = relative(root, file);

    // `relative` works on Windows and POSIX, unlike a hard-coded `/` prefix.
    if (pathFromRoot.startsWith('..') || pathFromRoot.startsWith(sep) || pathFromRoot === '') {
      throw new Error('Invalid path');
    }

    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(Number(process.env.PORT || 4173), () => console.log('ChronoCity: http://localhost:4173'));
