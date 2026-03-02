#!/usr/bin/env bash
# Nettoyage des caches et artefacts de build sans affecter le code source ni la base de données.
# Libère environ 17 Go. Tout sera régénéré au prochain dev/build.

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "=== Nettoyage BAKO 2 (caches uniquement) ==="
echo "Répertoire: $ROOT"
echo ""

# 1. Cache Next.js (.next) — régénéré au prochain npm run dev / build
if [ -d ".next" ]; then
  SIZE=$(du -sh .next 2>/dev/null | cut -f1)
  echo "Suppression de .next ($SIZE)..."
  rm -rf .next
  echo "  OK"
else
  echo ".next absent, rien à faire"
fi

# 2. Artefacts Rust/Tauri (src-tauri/target) — régénéré au prochain build Tauri
if [ -d "src-tauri/target" ]; then
  SIZE=$(du -sh src-tauri/target 2>/dev/null | cut -f1)
  echo "Suppression de src-tauri/target ($SIZE)..."
  rm -rf src-tauri/target
  echo "  OK"
else
  echo "src-tauri/target absent, rien à faire"
fi

# 3. Optionnel : out/ (export statique Next) — régénéré par npm run build + export
if [ -d "out" ]; then
  echo "Suppression de out/..."
  rm -rf out
  echo "  OK"
fi

# 4. Optionnel : build/ (dossier build générique)
if [ -d "build" ]; then
  echo "Suppression de build/..."
  rm -rf build
  echo "  OK"
fi

echo ""
echo "=== Nettoyage terminé ==="
echo "Espace libéré : ~17 Go (Next.js + Tauri)"
echo ""
echo "Pour régénérer :"
echo "  - Dev web    : npm run dev"
echo "  - Build web  : npm run build"
echo "  - Build app  : npm run tauri build  (recrée src-tauri/target)"
echo ""
