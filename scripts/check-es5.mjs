// Fails if a shipped file uses syntax newer than ES5, which 2017 Samsung TVs
// (Tizen 3.0, Chromium 47) can't parse.
import { readFileSync } from 'node:fs';
import { parse } from 'acorn';

const files = ['dist/index.cjs', 'dist/waktu-solat.js', 'dist/waktu-solat.min.js'];
let failed = false;

for (const file of files) {
  try {
    parse(readFileSync(file, 'utf8'), { ecmaVersion: 5, sourceType: 'script' });
    console.log('ES5 OK   ' + file);
  } catch (e) {
    failed = true;
    console.error('NOT ES5  ' + file + ': ' + e.message);
  }
}

// The ES module build may use import/export, but nothing else past ES5.
const esm = readFileSync('dist/index.mjs', 'utf8')
  .replace(/^export \{[^}]*\};?\s*$/m, '');
try {
  parse(esm, { ecmaVersion: 5, sourceType: 'script' });
  console.log('ES5 OK   dist/index.mjs (apart from export)');
} catch (e) {
  failed = true;
  console.error('NOT ES5  dist/index.mjs: ' + e.message);
}

process.exit(failed ? 1 : 0);
