#!/usr/bin/env node
// Ensures lightningcss fallback path finds the native binary when running under Turbopack.
const path = require('path');
const fs = require('fs');

const isDarwinArm64 = process.platform === 'darwin' && process.arch === 'arm64';
const nodeFile = 'lightningcss.darwin-arm64.node';
const lightningcssDir = path.join(__dirname, '..', 'node_modules', 'lightningcss');
const targetPath = path.join(__dirname, '..', 'node_modules', 'lightningcss-darwin-arm64', nodeFile);
const destPath = path.join(lightningcssDir, nodeFile);

if (!isDarwinArm64 || !fs.existsSync(targetPath)) return;

try {
  fs.copyFileSync(targetPath, destPath);
} catch (e) {
  if (e.code !== 'EEXIST') throw e;
}
