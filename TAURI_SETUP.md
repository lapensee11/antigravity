# Guide de configuration Tauri pour BAKO

## ✅ Étapes complétées

1. ✅ Rust configuré avec `rustup default stable`
2. ✅ Tauri CLI installé
3. ✅ Structure Tauri créée (`src-tauri/`)

## 📋 Prochaines étapes

### 1. Créer les icônes (OBLIGATOIRE)

Vous devez créer les icônes pour l'application. Voici comment :

#### Option A : Utiliser une image existante

Si vous avez une image logo (PNG, 1024x1024 recommandé) :

```bash
# Installer iconutil (macOS) ou utiliser un outil en ligne
# Placez votre image dans src-tauri/icons/icon.png (1024x1024)

# Sur macOS, vous pouvez créer un .icns depuis un dossier d'icônes
mkdir -p src-tauri/icons.iconset
# Copiez vos icônes dans différents formats dans iconset/
# Puis :
iconutil -c icns src-tauri/icons.iconset -o src-tauri/icons/icon.icns
```

#### Option B : Utiliser Tauri CLI pour générer les icônes

```bash
# Si vous avez une image source (1024x1024 PNG)
npx tauri icon path/to/your-icon.png
```

#### Option C : Icônes temporaires (pour tester)

Pour tester rapidement, vous pouvez créer des icônes simples :

```bash
cd src-tauri/icons
# Créer des icônes de base (vous devrez les remplacer plus tard)
touch 32x32.png 128x128.png 128x128@2x.png icon.icns icon.ico
```

### 2. Construire l'application

```bash
# Construire l'app Next.js puis Tauri
npm run build:dmg
```

Ou étape par étape :

```bash
# 1. Construire Next.js
npm run build

# 2. Construire Tauri (cela créera le DMG automatiquement)
npm run tauri:build
```

### 3. Résultat

Le DMG sera créé dans :
```
src-tauri/target/release/bundle/dmg/BAKO_0.1.0_x64.dmg
```

## 🔧 Configuration actuelle

- **App Name**: BAKO
- **Version**: 0.1.0
- **Identifier**: com.bako.app
- **Frontend**: Next.js (dossier `out`)
- **Dev URL**: http://localhost:3000

## 📝 Notes importantes

1. **Première compilation Rust** : La première fois que vous compilez, cela peut prendre 5-10 minutes car Rust télécharge et compile toutes les dépendances.

2. **Icônes** : Les icônes sont obligatoires. Sans elles, la compilation échouera.

3. **DMG automatique** : Tauri crée automatiquement un DMG lors de la compilation en mode release.

4. **Code signing** : Pour distribuer l'app, vous devrez peut-être signer le code avec un certificat Apple Developer (optionnel pour usage interne).

## 🐛 Dépannage

### Erreur : "icon not found"
→ Créez les icônes dans `src-tauri/icons/`

### Erreur : "frontendDist not found"
→ Assurez-vous d'avoir exécuté `npm run build` avant `npm run tauri:build`

### Compilation Rust lente
→ C'est normal la première fois. Les compilations suivantes seront plus rapides.
