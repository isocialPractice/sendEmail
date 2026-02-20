#!/usr/bin/env node
/**
 * bin/sendEmail.js
 * Cross-platform Node.js entry point for the sendEmail CLI.
 * This is the file referenced by package.json "bin" field.
 *
 * Usage: node bin/sendEmail.js [options]
 * Or via npm link/install: sendEmail [options]
 */

import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = resolve(__dirname, '..');

// Try compiled dist first, fall back to tsx for development
const distEntry = resolve(rootPath, 'dist', 'cli', 'index.js');
const srcEntry = resolve(rootPath, 'src', 'cli', 'index.ts');

if (existsSync(distEntry)) {
  // Production: use compiled JS
  const { run } = await import(pathToFileURL(distEntry).href);
  await run().catch(err => {
    console.error('[sendEmail] Fatal error:', err.message);
    process.exit(1);
  });
} else if (existsSync(srcEntry)) {
  // Development: use tsx to run TypeScript directly
  console.error('[sendEmail] dist/ not found. Run `npm run build` to compile.');
  console.error('For development, use: npm run dev');
  process.exit(1);
} else {
  console.error('[sendEmail] Could not find entry point.');
  console.error('  dist/cli/index.js not found. Run `npm run build`.');
  process.exit(1);
}
