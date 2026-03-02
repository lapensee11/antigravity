# Guide de création du DMG macOS

Ce guide explique comment construire l'application BAKO et créer un fichier DMG pour macOS.

## Prérequis

- macOS
- Node.js et npm installés
- Toutes les dépendances installées (`npm install`)

## Méthode 1 : Utiliser le script npm (Recommandé)

```bash
npm run build:dmg
```

ou

```bash
npm run dmg
```

## Méthode 2 : Utiliser le script directement

```bash
./create-dmg.sh
```

## Ce que fait le script

1. **Nettoie** les anciens builds
2. **Construit** l'application Next.js (si nécessaire)
3. **Crée** un bundle macOS (.app)
4. **Génère** un fichier DMG avec :
   - L'application BAKO.app
   - Un lien vers le dossier Applications
   - Un fichier README avec les instructions

## Résultat : un seul dossier pour tous les DMG

**Tous les DMG sont regroupés dans un seul dossier pour éviter de chercher dans plusieurs chemins :**

- **`dist/dmg/`** (à la racine du projet)

Que vous utilisiez `npm run dmg`, `./build-tauri.sh`, `./create-dmg.sh`, `./build-dmg.sh` ou le build universel, le fichier final est copié ou généré dans `dist/dmg/`. Exemples de noms :
- `BAKO-0.1.0.dmg` (build classique)
- `BAKO_0.1.0_universal.dmg` (build universel Apple Silicon + Intel)

## Installation

1. Double-cliquez sur le fichier DMG
2. Glissez `BAKO.app` dans le dossier Applications
3. Ouvrez Applications et lancez BAKO.app

## Notes

- Le DMG créé ouvre l'application dans le navigateur par défaut
- Pour une expérience plus native, considérez l'utilisation d'Electron ou Tauri
- La taille du DMG sera affichée à la fin du processus

## Personnalisation

Pour modifier le nom de l'application ou la version, éditez les variables au début du script `create-dmg.sh` :

```bash
APP_NAME="BAKO"
APP_VERSION="0.1.0"
```
