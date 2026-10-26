import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
let checked = 0;

for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attributes = match[1];
  if (/\bsrc\s*=/.test(attributes)) continue;
  if (/\btype\s*=\s*["'](?:application\/ld\+json|application\/json)["']/.test(attributes)) continue;
  new Script(match[2], { filename: `dist/index.html:inline-${checked + 1}` });
  checked += 1;
}

console.log(`JavaScript syntax OK (${checked} inline script${checked === 1 ? '' : 's'}). Browser interactions still need verification.`);
