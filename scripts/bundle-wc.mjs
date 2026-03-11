import { build } from 'esbuild';
import { readdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';

const dist = resolve('dist/webcomponents');
// Angular application builder outputs the entry as main.js
const entry = join(dist, 'main.js');
const out = join(dist, 'declarative-table.js');

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  outfile: out,
  minify: true,
  logLevel: 'warning',
});

// Remove the original main.js — replaced by the bundled declarative-table.js
unlinkSync(entry);

// Remove leftover chunk files and build artifacts
const cleanup = ['prerendered-routes.json', '3rdpartylicenses.txt'];
for (const file of readdirSync(dist)) {
  if (
    (file.startsWith('chunk-') && file.endsWith('.js')) ||
    cleanup.includes(file)
  ) {
    unlinkSync(join(dist, file));
  }
}

console.log(
  'Single-file bundle written to dist/webcomponents/declarative-table.js',
);
