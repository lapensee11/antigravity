# ✅ Solution pour Construire le DMG avec Tauri

## 🎯 Problème résolu

Le problème venait de la variable d'environnement `CI` qui était définie automatiquement. La solution est de définir `CI=false` avant d'exécuter la commande.

## 🚀 Commande à utiliser

Depuis le dossier racine du projet :

```bash
cd src-tauri
CI=false node ../node_modules/@tauri-apps/cli/tauri.js build
```

**OU** utilisez le script que j'ai créé :

```bash
./build-tauri-direct.sh
```

## 📋 Étapes complètes

### Option 1 : Script automatique (Recommandé)

```bash
./build-tauri-direct.sh
```

### Option 2 : Commandes manuelles

```bash
# 1. S'assurer que Next.js est construit
npm run build

# 2. Aller dans src-tauri
cd src-tauri

# 3. Construire avec CI=false
CI=false node ../node_modules/@tauri-apps/cli/tauri.js build
```

## ⏱️ Temps estimé

- **Première compilation Rust** : 5-10 minutes (télécharge et compile ~470 packages)
- **Compilations suivantes** : 2-5 minutes

## 📦 Résultat

Le DMG sera créé dans :
```
src-tauri/target/release/bundle/dmg/BAKO_0.1.0_x64.dmg
```

## 🔧 Scripts npm mis à jour

J'ai aussi mis à jour `package.json` avec la bonne commande :

```bash
npm run tauri:build
```

Cette commande fonctionne maintenant correctement !

## 📝 Notes importantes

1. **Première compilation** : Rust télécharge et compile beaucoup de dépendances la première fois
2. **DMG automatique** : Tauri crée automatiquement le DMG après la compilation réussie
3. **CI=false** : Nécessaire pour éviter l'erreur `invalid value '1' for '--ci'`

## 🎉 Prêt !

Exécutez simplement :
```bash
./build-tauri-direct.sh
```

Et attendez la fin de la compilation ! Le DMG sera prêt dans `src-tauri/target/release/bundle/dmg/`

---

## Erreur `failed to run bundle_dmg.sh` / `hdiutil: create failed - Device not configured`

Si le build échoue à l’étape de création du DMG avec une erreur du type **`failed to run bundle_dmg.sh`** ou **`hdiutil: create failed - Device not configured`**, c’est en général parce que la création d’image disque est bloquée par l’environnement (sandbox, CI, ou droits limités).

### Solution 1 : Build sans DMG (uniquement le .app)

Générez uniquement le bundle **.app** (pas de DMG). Vous pourrez créer un DMG plus tard avec l’Utilitaire de disque ou un script si besoin.

**ARM64 (Apple Silicon) :**
```bash
npm run build
npm run tauri:build:arm64:app
```

**Intel :**
```bash
npm run build
npm run tauri:build:intel:app
```

Le fichier **BAKO.app** se trouve dans :
- ARM64 : `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/BAKO.app`
- Intel : `src-tauri/target/x86_64-apple-darwin/release/bundle/macos/BAKO.app`

### Solution 2 : Build avec DMG dans un Terminal « normal »

Pour que le DMG soit créé, lancez le build depuis un **Terminal macOS** (pas depuis l’IDE ou un environnement sandbox) :

```bash
cd "/Users/studio/BAKO 2"
npm run build
npm run tauri:build:arm64
```

Si vous utilisez le script universel, exécutez-le aussi depuis le Terminal :

```bash
npm run build:dmg:universal
```
