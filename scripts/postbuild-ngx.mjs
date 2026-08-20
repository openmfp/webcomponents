import { copyFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';

// Post-build for @openmfp/ngx (built by ng-packagr into dist/ngx).
//
// 1. Strip *.map source maps so they are not shipped in the npm tarball —
//    ng-packagr emits an fesm .mjs.map (~300 KB) that has no value for
//    consumers and bloats the package.
// 2. Copy the repository LICENSE into the package so the Apache-2.0 text
//    ships alongside the `license` field declared in package.json.

const dist = resolve('dist/ngx');

function removeMaps(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      removeMaps(full);
    } else if (entry.endsWith('.map')) {
      unlinkSync(full);
      console.log(`Removed source map ${full}`);
    }
  }
}

removeMaps(dist);

copyFileSync(resolve('LICENSE'), join(dist, 'LICENSE'));
console.log('Copied LICENSE to dist/ngx/LICENSE');
