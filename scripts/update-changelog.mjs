// Inserts a generated release section into CHANGELOG.md beneath the insertion marker.
// Usage: node scripts/update-changelog.mjs <sectionFile>
import { readFileSync, writeFileSync } from 'fs';

const MARKER = '<!-- git-cliff:insert -->';
const sectionFile = process.argv[2];

if (!sectionFile) {
  console.error('Usage: node scripts/update-changelog.mjs <sectionFile>');
  process.exit(1);
}

const changelog = readFileSync('CHANGELOG.md', 'utf8');
if (!changelog.includes(MARKER)) {
  console.error('Insertion marker not found in CHANGELOG.md');
  process.exit(1);
}

const section = readFileSync(sectionFile, 'utf8').trim();
const updated = changelog.replace(MARKER, `${MARKER}\n\n${section}`);
writeFileSync('CHANGELOG.md', updated);
console.log('CHANGELOG.md updated.');
