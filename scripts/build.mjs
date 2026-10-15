import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
async function copy(relative) { const from = path.join(root, relative); const to = path.join(dist, relative); await fs.mkdir(path.dirname(to), { recursive: true }); await fs.cp(from, to, { recursive: true }); }
for (const file of ['index.html','styles.css','app.js']) await copy(file);
for (const dir of ['data','lib']) await copy(dir);
await fs.cp(path.join(root, 'public'), dist, { recursive: true });
console.log(`Built ${dist}`);
