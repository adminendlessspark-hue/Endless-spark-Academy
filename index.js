// Universal entry point for Hostinger, cPanel, CloudLinux Passenger, and Node environments.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const candidates = [
  path.join(__dirname, 'dist', 'server.cjs'),
  path.join(__dirname, 'dist', 'server.js'),
  path.join(process.cwd(), 'dist', 'server.cjs'),
  path.join(process.cwd(), 'dist', 'server.js')
];

let loaded = false;
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    console.log(`[Hostinger Loader] Starting production bundle from: ${candidate}`);
    require(candidate);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.error("[Hostinger Loader Error] Could not find compiled dist/server.cjs! Please execute 'npm run build' before starting.");
  process.exit(1);
}
