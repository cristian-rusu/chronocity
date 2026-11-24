import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const source = join(process.cwd(), 'src');
function files(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]); }
const errors = [];
for (const file of files(source).filter((name) => /\.(tsx?|css)$/.test(name) && !/^((app|data|engine|simulation)\.ts|styles\.css)$/.test(relative(source, name)))) {
  const path = relative(source, file).replaceAll('\\', '/');
  const text = readFileSync(file, 'utf8');
  if (path.endsWith('.css') && /\b\d+(?:\.\d+)?px\b/.test(text)) errors.push(`${path}: forbidden px unit`);
  if (!path.endsWith('.ts') && !path.endsWith('.tsx')) continue;
  const imports = [...text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const owner = /^modules\/([^/]+)/.exec(path)?.[1];
  for (const specifier of imports) {
    const target = /modules\/([^/]+)\/(.+)/.exec(specifier);
    if (target && target[1] !== owner && !['public-api', 'public-api.ts'].includes(target[2])) errors.push(`${path}: deep import ${specifier}`);
    if (path.includes('/domain/') && /react|zustand|infrastructure|pages|app\//.test(specifier)) errors.push(`${path}: domain dependency ${specifier}`);
    if (path.startsWith('shared/') && specifier.includes('modules/')) errors.push(`${path}: shared depends on business module`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log('Architecture and CSS unit checks passed.');
