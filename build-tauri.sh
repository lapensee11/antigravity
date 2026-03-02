#!/bin/bash

# Script pour construire Tauri et créer le DMG
cd "$(dirname "$0")"

RELEASE_DMG_DIR="dist/dmg"
TAURI_DMG_DIR="src-tauri/target/release/bundle/dmg"

echo "🚀 Construction de l'application Tauri..."

# Construire Next.js d'abord si nécessaire
if [ ! -d "out" ]; then
    echo "📦 Construction de Next.js..."
    npm run build
fi

# Construire Tauri
echo "🔨 Compilation Rust et création du DMG..."
cd src-tauri
cargo tauri build
cd ..

# Copier le(s) DMG dans un seul dossier pour ne pas chercher dans target/
mkdir -p "$RELEASE_DMG_DIR"
if [ -d "$TAURI_DMG_DIR" ]; then
  for f in "$TAURI_DMG_DIR"/*.dmg; do
    [ -f "$f" ] && cp "$f" "$RELEASE_DMG_DIR/" && echo "📦 Copié: $(basename "$f")"
  done
fi

echo "✅ Terminé ! DMG disponible dans: $RELEASE_DMG_DIR/"
