/**
 * Builds the WXT extension, zips it, and copies the zip to apps/web/public/
 * so Next.js can serve it at /extension.zip for the Install page download.
 *
 * Run automatically via the "prebuild" script in apps/web/package.json.
 */
import { execSync } from 'child_process';
import { mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const webRoot = resolve(scriptDir, '..');
const extRoot = resolve(webRoot, '../extension');
const outputDir = join(extRoot, '.output');
const publicDir = join(webRoot, 'public');

console.log('▸ Building extension…');
execSync('npm run build', { cwd: extRoot, stdio: 'inherit' });

console.log('▸ Zipping extension…');
execSync('npm run zip', { cwd: extRoot, stdio: 'inherit' });

const zipFile = readdirSync(outputDir).find((f) => f.endsWith('.zip'));
if (!zipFile) throw new Error('wxt zip produced no .zip file in .output/');

mkdirSync(publicDir, { recursive: true });
copyFileSync(join(outputDir, zipFile), join(publicDir, 'extension.zip'));
console.log(`✓ ${zipFile} → public/extension.zip`);
