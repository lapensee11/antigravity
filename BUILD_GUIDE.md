# 🚀 Guide de construction du DMG avec Tauri

## ✅ Configuration terminée

Tout est prêt ! Voici comment construire votre DMG :

## 📋 Commandes à exécuter

### Étape 1 : Construire l'application Next.js
```bash
npm run build
```

Cette commande génère les fichiers statiques dans le dossier `out/`.

### Étape 2 : Construire l'application Tauri (crée le DMG automatiquement)
```bash
npm run tauri:build
```

**OU** en une seule commande :
```bash
npm run build:dmg
```

## ⏱️ Temps de compilation

- **Première fois** : 5-10 minutes (Tauri télécharge et compile Rust)
- **Compilations suivantes** : 2-5 minutes

## 📦 Résultat

Le DMG sera créé dans :
```
src-tauri/target/release/bundle/dmg/BAKO_0.1.0_x64.dmg
```

## 🎯 Utilisation du DMG

1. Double-cliquez sur le fichier `.dmg`
2. Glissez `BAKO.app` dans le dossier Applications
3. Lancez l'application depuis Applications

## 🔧 Configuration actuelle

- **Nom de l'app** : BAKO
- **Version** : 0.1.0
- **Identifier** : com.bako.app
- **Fenêtre** : 1920x1080 (redimensionnable, min 1280x720)
- **Icônes** : Générées depuis `logo-boujniba.png` ✅

## 🐛 Dépannage

### Erreur : "frontendDist not found"
→ Exécutez d'abord `npm run build` pour créer le dossier `out/`

### Erreur : "icon not found"
→ Les icônes sont déjà générées dans `src-tauri/icons/`

### Compilation Rust très lente
→ C'est normal la première fois. Les dépendances Rust sont compilées.

### Erreur de permissions
→ Assurez-vous d'avoir les droits d'écriture dans le dossier du projet

## 📝 Notes importantes

1. **Première compilation** : Rust télécharge ~200MB de dépendances la première fois
2. **DMG automatique** : Tauri crée automatiquement le DMG lors de la compilation
3. **Code signing** : Pour distribuer publiquement, vous devrez signer avec un certificat Apple Developer (optionnel pour usage interne)

## 🎉 Prêt à construire !

Exécutez simplement :
```bash
npm run build:dmg
```

Et attendez la fin de la compilation ! 🚀
