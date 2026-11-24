import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const source = join(process.cwd(), 'src');
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}
const errors = [];
const graph = new Map();
for (const file of files(source).filter((name) => /\.(tsx?|css)$/.test(name))) {
  const path = relative(source, file).replaceAll('\\', '/');
  if (['app.ts', 'data.ts', 'engine.ts', 'simulation.ts'].includes(path)) continue;
  const content = readFileSync(file, 'utf8');
  if (path.endsWith('.css') && /\b\d+(?:\.\d+)?px\b/.test(content))
    errors.push(`${path}: forbidden px unit`);
  if (!/\.tsx?$/.test(path)) continue;
  const owner = /^contexts\/([^/]+)/.exec(path)?.[1];
  const imports = [...content.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
  const layer = /^contexts\/[^/]+\/(domain|application|infrastructure|presentation)\//.exec(
    path,
  )?.[1];
  for (const specifier of imports) {
    if (specifier.startsWith('.')) {
      const base = resolve(dirname(file), specifier);
      if (
        !existsSync(base) &&
        !['.ts', '.tsx', '.css', '.module.css', '/index.ts', '/index.tsx'].some((suffix) =>
          existsSync(base + suffix),
        )
      )
        errors.push(`${path}: unresolved import ${specifier}`);
    }
    const resolved = specifier.startsWith('.')
      ? relative(source, resolve(dirname(file), specifier)).replaceAll('\\', '/')
      : specifier;
    const target = /^contexts\/([^/]+)\/(.+)/.exec(resolved);
    const allowed = [
      'public-api',
      'public-api.ts',
      'public-contracts',
      'public-contracts.ts',
      'presentation/public-api',
      'presentation/public-api.ts',
    ];
    if (target && target[1] !== owner && !allowed.includes(target[2]))
      errors.push(`${path}: deep import ${specifier}`);
    if (layer === 'domain' && /^(react|zustand|react-dom|react-router-dom)(\/|$)/.test(specifier))
      errors.push(`${path}: domain UI dependency ${specifier}`);
    if (layer === 'application' && /^(react|zustand|react-dom)(\/|$)/.test(specifier))
      errors.push(`${path}: application UI dependency ${specifier}`);
    if (owner && target && owner !== target[1] && layer !== 'presentation') {
      if (!graph.has(owner)) graph.set(owner, new Set());
      graph.get(owner).add(target[1]);
    }
    const ownLayer =
      target && target[1] === owner
        ? /^(domain|application|infrastructure|presentation)\//.exec(target[2])?.[1]
        : undefined;
    if (layer === 'domain' && ownLayer && ownLayer !== 'domain')
      errors.push(`${path}: domain depends outward on ${specifier}`);
    if (layer === 'application' && ['infrastructure', 'presentation'].includes(ownLayer))
      errors.push(`${path}: application depends outward on ${specifier}`);
    if (layer === 'infrastructure' && ownLayer === 'presentation')
      errors.push(`${path}: infrastructure depends on presentation ${specifier}`);
    if (path.startsWith('shared/') && target)
      errors.push(`${path}: shared depends on business module`);
  }
}
const visited = new Set();
const active = new Set();
function visit(context, trail) {
  if (active.has(context)) {
    errors.push(`context cycle: ${[...trail, context].join(' -> ')}`);
    return;
  }
  if (visited.has(context)) return;
  active.add(context);
  for (const next of graph.get(context) ?? []) visit(next, [...trail, context]);
  active.delete(context);
  visited.add(context);
}
for (const context of graph.keys()) visit(context, []);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log('Architecture boundaries passed.');
