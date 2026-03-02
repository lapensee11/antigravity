#!/usr/bin/env node
/**
 * Copie les DMG générés par Tauri depuis target/.../bundle/dmg vers dist/dmg
 * pour que tous les DMG soient au même endroit.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RELEASE_DMG_DIR = path.join(ROOT, 'dist', 'dmg');
const TAURI_TARGET = path.join(ROOT, 'src-tauri', 'target');

const targets = [
  'release',
  'aarch64-apple-darwin',
  'x86_64-apple-darwin',
];

if (!fs.existsSync(RELEASE_DMG_DIR)) {
  fs.mkdirSync(RELEASE_DMG_DIR, { recursive: true });
}

let copied = 0;
for (const target of targets) {
  const dmgDir = path.join(TAURI_TARGET, target, 'release', 'bundle', 'dmg');
  if (!fs.existsSync(dmgDir)) continue;
  const files = fs.readdirSync(dmgDir).filter(f => f.endsWith('.dmg') && !f.startsWith('temp_'));
  for (const name of files) {
    const src = path.join(dmgDir, name);
    const dest = path.join(RELEASE_DMG_DIR, name);
    fs.copyFileSync(src, dest);
    console.log('📦 Copié:', name, '→ dist/dmg/');
    copied++;
  }
}

if (copied > 0) {
  console.log('✅ DMG disponible dans: dist/dmg/');
} else {
  console.log('ℹ️  Aucun DMG trouvé dans target (lancez d’abord le build).');
}
