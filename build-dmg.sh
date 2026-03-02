#!/bin/bash

# Script pour construire l'application et créer un DMG macOS
# Usage: ./build-dmg.sh

set -e

APP_NAME="BAKO"
APP_VERSION="0.1.0"
BUILD_DIR="build"
RELEASE_DMG_DIR="dist/dmg"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"
DMG_NAME="${APP_NAME}-${APP_VERSION}.dmg"
DMG_PATH="${RELEASE_DMG_DIR}/${DMG_NAME}"

echo "🚀 Construction de l'application ${APP_NAME}..."

# Nettoyer les anciens builds
echo "🧹 Nettoyage des anciens builds..."
rm -rf "${BUILD_DIR}"
rm -rf "out"

# Construire l'application Next.js
echo "📦 Construction de l'application Next.js..."
npm run build

# Vérifier que le dossier out existe
if [ ! -d "out" ]; then
    echo "❌ Erreur: Le dossier 'out' n'existe pas après le build"
    exit 1
fi

# Créer les dossiers de build et de sortie DMG
mkdir -p "${BUILD_DIR}"
mkdir -p "${RELEASE_DMG_DIR}"

# Créer la structure du bundle .app
echo "📱 Création du bundle macOS..."
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# Copier les fichiers statiques dans Resources
cp -r out/* "${APP_BUNDLE}/Contents/Resources/"

# Créer le script de lancement
cat > "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}" << 'EOF'
#!/bin/bash
# Obtenir le répertoire du script
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="${APP_DIR}/../Resources"

# Ouvrir l'application dans le navigateur par défaut
open -a "Safari" "${RESOURCES_DIR}/index.html" || open "${RESOURCES_DIR}/index.html"
EOF

chmod +x "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

# Créer le fichier Info.plist
cat > "${APP_BUNDLE}/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.bako.app</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>${APP_VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${APP_VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# Créer l'icône (optionnel - vous pouvez ajouter une icône .icns plus tard)
# Pour l'instant, on utilise l'icône par défaut

echo "💿 Création du DMG..."

# Créer un dossier temporaire pour le DMG
DMG_TEMP="${BUILD_DIR}/dmg-temp"
rm -rf "${DMG_TEMP}"
mkdir -p "${DMG_TEMP}"

# Copier l'app dans le dossier temporaire
cp -R "${APP_BUNDLE}" "${DMG_TEMP}/"

# Créer un lien vers Applications (optionnel)
ln -s /Applications "${DMG_TEMP}/Applications"

# Créer le DMG avec hdiutil
hdiutil create -volname "${APP_NAME}" \
    -srcfolder "${DMG_TEMP}" \
    -ov \
    -format UDZO \
    "${DMG_PATH}"

# Nettoyer le dossier temporaire
rm -rf "${DMG_TEMP}"

echo "✅ DMG créé avec succès: ${DMG_PATH}"
echo "📦 Taille du DMG: $(du -h "${DMG_PATH}" | cut -f1)"
echo "📁 Tous les DMG sont dans: ${RELEASE_DMG_DIR}"
