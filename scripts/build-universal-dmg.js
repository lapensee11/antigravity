#!/usr/bin/env node
/**
 * Script pour créer un DMG universel (Apple Silicon + Intel)
 * 
 * Ce script :
 * 1. Build les deux versions (arm64 et x86_64)
 * 2. Crée un binaire universel avec lipo
 * 3. Crée le DMG avec le binaire universel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TAURI_DIR = path.join(__dirname, '..', 'src-tauri');
const TARGET_DIR = path.join(TAURI_DIR, 'target');
/** Dossier unique pour tous les DMG (évite de chercher dans target/...) */
const RELEASE_DMG_DIR = path.join(__dirname, '..', 'dist', 'dmg');

console.log('🚀 Construction du DMG universel (Apple Silicon + Intel)...\n');

// 1. Build Next.js
console.log('📦 Build Next.js...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Build Next.js terminé\n');
} catch (error) {
  console.error('❌ Erreur lors du build Next.js:', error.message);
  process.exit(1);
}

// 2. Vérifier que les cibles Rust sont installées
console.log('🔍 Vérification des cibles Rust...');
const targets = ['aarch64-apple-darwin', 'x86_64-apple-darwin'];
for (const target of targets) {
  try {
    execSync(`rustup target list --installed | grep -q "${target}" || rustup target add ${target}`, { stdio: 'pipe' });
    console.log(`✅ Cible ${target} disponible`);
  } catch (error) {
    console.log(`📥 Installation de la cible ${target}...`);
    execSync(`rustup target add ${target}`, { stdio: 'inherit' });
  }
}
console.log('');

// 3. Build Tauri pour arm64 (Apple Silicon)
console.log('🔨 Build Tauri pour Apple Silicon (arm64)...');
try {
  execSync(
    'CI=false node ../node_modules/@tauri-apps/cli/tauri.js build --target aarch64-apple-darwin',
    { stdio: 'inherit', cwd: TAURI_DIR }
  );
  console.log('✅ Build arm64 terminé\n');
} catch (error) {
  console.error('❌ Erreur lors du build arm64:', error.message);
  process.exit(1);
}

// 4. Build Tauri pour x86_64 (Intel)
console.log('🔨 Build Tauri pour Intel (x86_64)...');
try {
  execSync(
    'CI=false node ../node_modules/@tauri-apps/cli/tauri.js build --target x86_64-apple-darwin',
    { stdio: 'inherit', cwd: TAURI_DIR }
  );
  console.log('✅ Build x86_64 terminé\n');
} catch (error) {
  console.error('❌ Erreur lors du build x86_64:', error.message);
  process.exit(1);
}

// 5. Chemins des binaires
const arm64Binary = path.join(TARGET_DIR, 'aarch64-apple-darwin', 'release', 'BAKO');
const x86Binary = path.join(TARGET_DIR, 'x86_64-apple-darwin', 'release', 'BAKO');
const universalBinary = path.join(TARGET_DIR, 'universal-apple-darwin', 'release', 'BAKO');

// 6. Créer le répertoire pour le binaire universel
const universalDir = path.join(TARGET_DIR, 'universal-apple-darwin', 'release');
if (!fs.existsSync(universalDir)) {
  fs.mkdirSync(universalDir, { recursive: true });
}

// 7. Créer le binaire universel avec lipo
console.log('🔗 Création du binaire universel avec lipo...');
try {
  execSync(
    `lipo -create "${arm64Binary}" "${x86Binary}" -output "${universalBinary}"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Binaire universel créé\n');
} catch (error) {
  console.error('❌ Erreur lors de la création du binaire universel:', error.message);
  console.error('💡 Assurez-vous que lipo est disponible (Xcode Command Line Tools)');
  process.exit(1);
}

// 8. Vérifier le binaire universel
console.log('🔍 Vérification du binaire universel...');
try {
  const lipoInfo = execSync(`lipo -info "${universalBinary}"`, { encoding: 'utf-8' });
  console.log(lipoInfo);
  if (lipoInfo.includes('arm64') && lipoInfo.includes('x86_64')) {
    console.log('✅ Binaire universel valide (contient arm64 et x86_64)\n');
  } else {
    console.warn('⚠️  Le binaire ne semble pas universel');
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification:', error.message);
}

// 9. Copier le bundle .app depuis un des builds et remplacer le binaire
console.log('📋 Préparation du bundle universel...');
const arm64Bundle = path.join(TARGET_DIR, 'aarch64-apple-darwin', 'release', 'bundle');
const arm64Macos = path.join(arm64Bundle, 'macos');
const universalMacos = path.join(TARGET_DIR, 'universal-apple-darwin', 'release', 'bundle', 'macos');

// Trouver le .app dans le bundle macos
let appPath = null;
if (fs.existsSync(arm64Macos)) {
  const files = fs.readdirSync(arm64Macos);
  const appDir = files.find(f => f.endsWith('.app'));
  if (appDir) {
    appPath = path.join(arm64Macos, appDir);
  }
}

if (!appPath || !fs.existsSync(appPath)) {
  console.error('❌ Impossible de trouver le bundle .app');
  process.exit(1);
}

// Copier le .app vers le répertoire universel
if (!fs.existsSync(universalMacos)) {
  fs.mkdirSync(universalMacos, { recursive: true });
}
const appName = path.basename(appPath);
const universalAppPath = path.join(universalMacos, appName);
if (fs.existsSync(universalAppPath)) {
  execSync(`rm -rf "${universalAppPath}"`, { stdio: 'pipe' });
}
execSync(`cp -R "${appPath}" "${universalAppPath}"`, { stdio: 'inherit' });

// Remplacer le binaire dans le .app
const macosDir = path.join(universalAppPath, 'Contents', 'MacOS');
if (fs.existsSync(macosDir)) {
  const binaryInApp = path.join(macosDir, 'BAKO');
  if (fs.existsSync(binaryInApp)) {
    fs.copyFileSync(universalBinary, binaryInApp);
    execSync(`chmod +x "${binaryInApp}"`, { stdio: 'pipe' });
    console.log('✅ Binaire universel copié dans le bundle\n');
  }
}

// 10. Créer le DMG avec le bundle universel
console.log('📦 Création du DMG universel...');
const universalDmgDir = path.join(TARGET_DIR, 'universal-apple-darwin', 'release', 'bundle', 'dmg');
if (!fs.existsSync(universalDmgDir)) {
  fs.mkdirSync(universalDmgDir, { recursive: true });
}

const appNameWithoutExt = appName.replace('.app', '');
const dmgName = `${appNameWithoutExt}_0.1.0_universal.dmg`;
const dmgPath = path.join(universalDmgDir, dmgName);

// Utiliser hdiutil pour créer le DMG directement
try {
  // Créer un DMG temporaire
  const tempDmg = path.join(universalDmgDir, `temp_${Date.now()}.dmg`);
  
  // Supprimer le DMG final s'il existe (évite "Le fichier existe" sur hdiutil convert)
  if (fs.existsSync(dmgPath)) {
    fs.unlinkSync(dmgPath);
  }

  // Créer le DMG avec hdiutil
  execSync(
    `hdiutil create -volname "${appNameWithoutExt}" -srcfolder "${universalMacos}" -ov -format UDZO "${tempDmg}"`,
    { stdio: 'inherit' }
  );
  
  // Convertir en DMG final compressé
  execSync(
    `hdiutil convert "${tempDmg}" -format UDZO -o "${dmgPath}"`,
    { stdio: 'inherit' }
  );
  
  // Supprimer le DMG temporaire
  if (fs.existsSync(tempDmg)) {
    fs.unlinkSync(tempDmg);
  }
  
  // Copier dans dist/dmg pour un accès unique
  if (!fs.existsSync(RELEASE_DMG_DIR)) {
    fs.mkdirSync(RELEASE_DMG_DIR, { recursive: true });
  }
  const releaseDmgPath = path.join(RELEASE_DMG_DIR, dmgName);
  fs.copyFileSync(dmgPath, releaseDmgPath);
  console.log(`\n🎉 DMG universel créé avec succès !`);
  console.log(`📦 Emplacement final (à utiliser): ${releaseDmgPath}`);
  console.log(`\n✅ Ce DMG fonctionne sur Mac Apple Silicon ET Intel !`);
} catch (error) {
  console.error('❌ Erreur lors de la création du DMG:', error.message);
  console.log('\n💡 Alternative: Le bundle .app universel est disponible dans:');
  console.log(`   ${universalAppPath}`);
  console.log('   Vous pouvez créer le DMG manuellement avec Disk Utility');
  console.log('   Ou utiliser: hdiutil create -volname "BAKO" -srcfolder "' + universalMacos + '" -ov -format UDZO "' + dmgPath + '"');
}
