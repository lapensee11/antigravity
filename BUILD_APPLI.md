# Reconstruire l’appli BAKO (méthode sûre)

## Prérequis

- **Node.js** et **npm** installés
- **Rust** installé (`rustup default stable`)
- **Dépendances npm** à jour : `npm install` si besoin

---

## Méthode en une commande (recommandée)

À la racine du projet (`BAKO 2`) :

```bash
npm run dmg
```

Cette commande enchaîne :
1. `npm run build` → build Next.js (dossier `out/`)
2. `npm run tauri:build` → build Tauri avec **CI=false** (évite l’erreur `--ci`)

Attendre la fin (plusieurs minutes la première fois). Le **DMG** est généré à la fin.

---

## Méthode pas à pas (si besoin de débugger)

### Étape 1 – Build Next.js

```bash
cd "/Users/MH11/BAKO 2"
npm run build
```

Vérifier que le dossier **`out/`** existe à la racine (export statique Next.js).

### Étape 2 – Build Tauri (avec CI=false)

**Important :** ne pas utiliser `npm run tauri build` seul, car la variable **CI** peut provoquer l’erreur `invalid value '1' for '--ci'`.

Depuis la racine du projet :

```bash
cd "/Users/MH11/BAKO 2"
npm run tauri:build
```

Ou manuellement :

```bash
cd "/Users/MH11/BAKO 2/src-tauri"
CI=false node ../node_modules/@tauri-apps/cli/tauri.js build
```

### Étape 3 – Récupérer l’appli et le DMG

- **App macOS :**  
  `src-tauri/target/release/bundle/macos/BAKO.app`

- **DMG d’installation :**  
  `src-tauri/target/release/bundle/dmg/BAKO_0.1.0_x64.dmg`

Ouvrir le DMG, glisser **BAKO** dans **Applications**.

---

## En cas d’erreur

| Problème | Action |
|----------|--------|
| `invalid value '1' for '--ci'` | Toujours lancer le build Tauri avec `CI=false` (comme dans `npm run tauri:build`). |
| `no such command: tauri` | Installer le CLI Cargo : `cargo install tauri-cli --version "^2.0"`, puis vous pouvez utiliser `cargo tauri build` **dans** `src-tauri` en ayant mis `CI=false` dans l’environnement avant. |
| Build Next.js en erreur | Corriger les erreurs TypeScript/ESLint affichées, puis relancer `npm run build`. |
| Dossier `out/` absent | Exécuter `npm run build` jusqu’à ce qu’il se termine sans erreur. |

---

## Résumé ultra-court

```bash
cd "/Users/MH11/BAKO 2"
npm run dmg
```

Puis ouvrir : **`src-tauri/target/release/bundle/dmg/BAKO_0.1.0_x64.dmg`**.
