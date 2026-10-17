import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const scanRoots = [resolve(root, 'app'), resolve(root, 'public/css'), resolve(root, 'public/js')];
const textExtensions = new Set(['.css', '.html', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.txt']);
const forbidden = [
  ['legacy template product name', /p[i]x[i]o/i],
  ['template marketplace link', /themeforest\.net/i],
  ['template author branding', /dexignzone/i],
  ['legacy external runtime', /dzassets\.s3\.amazonaws\.com/i],
];

const failures = [];

async function scanDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scanDirectory(path);
      continue;
    }
    if (!textExtensions.has(extname(entry.name).toLowerCase())) continue;

    const text = await readFile(path, 'utf8');
    for (const [label, pattern] of forbidden) {
      if (pattern.test(text)) {
        failures.push(`${relative(root, path)}: ${label}`);
      }
    }
  }
}

for (const directory of scanRoots) {
  await scanDirectory(directory);
}

if (failures.length) {
  console.error('Legacy branding/runtime references found in public application files:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Public Loopora application is free of legacy template branding/runtime references.');
