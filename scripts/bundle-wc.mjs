import { build } from 'esbuild';
import { readdirSync, unlinkSync, rmSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const publicDir = resolve('public');
mkdirSync(publicDir, { recursive: true });

const cleanup = ['prerendered-routes.json', '3rdpartylicenses.txt'];

function cleanDist(dir) {
  for (const file of readdirSync(dir)) {
    if (
      (file.startsWith('chunk-') && file.endsWith('.js')) ||
      cleanup.includes(file)
    ) {
      unlinkSync(join(dir, file));
    }
  }
}

// --- mfp-webcomponents.js (all components) ---
const dist = resolve('dist/webcomponents');
const entry = join(dist, 'main.js');
const out = join(dist, 'mfp-webcomponents.js');

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  outfile: out,
  minify: true,
  logLevel: 'warning',
});

unlinkSync(entry);
cleanDist(dist);

console.log('Single-file bundle written to dist/webcomponents/mfp-webcomponents.js');
copyFileSync(out, join(publicDir, 'mfp-webcomponents.js'));
console.log('Copied to public/mfp-webcomponents.js');

// --- mfp-wc-dashboard.js (dashboard only) ---
const dashDist = resolve('dist/webcomponents-dashboard');
const dashEntry = join(dashDist, 'main.js');
const dashOut = join(dist, 'mfp-wc-dashboard.js');

await build({
  entryPoints: [dashEntry],
  bundle: true,
  format: 'esm',
  outfile: dashOut,
  minify: true,
  logLevel: 'warning',
});

unlinkSync(dashEntry);
cleanDist(dashDist);
rmSync(dashDist, { recursive: true });

console.log('Single-file bundle written to dist/webcomponents/mfp-wc-dashboard.js');
copyFileSync(dashOut, join(publicDir, 'mfp-wc-dashboard.js'));
console.log('Copied to public/mfp-wc-dashboard.js');

// --- generate package.json for dist/webcomponents ---
const rootPkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const wcPkg = {
  name: '@openmfp/webcomponents',
  version: rootPkg.version,
  description: rootPkg.description ?? 'OpenMFP web components bundle',
  license: rootPkg.license ?? 'Apache-2.0',
  type: 'module',
  exports: {
    '.': './mfp-webcomponents.js',
    './dashboard': './mfp-wc-dashboard.js',
  },
  files: ['mfp-webcomponents.js', 'mfp-wc-dashboard.js'],
};
writeFileSync(join(dist, 'package.json'), JSON.stringify(wcPkg, null, 2) + '\n');
console.log('Generated dist/webcomponents/package.json');
