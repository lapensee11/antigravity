#!/bin/bash

# Script amélioré pour créer un DMG macOS avec une meilleure présentation
# Usage: ./create-dmg.sh

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

# Construire l'application Next.js si nécessaire
if [ ! -d "out" ]; then
    echo "📦 Construction de l'application Next.js..."
    npm run build
else
    echo "✅ Dossier 'out' trouvé, utilisation de la version existante"
fi

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

# Créer le script de lancement amélioré
cat > "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}" << 'EOF'
#!/bin/bash
# Obtenir le répertoire du script
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="${APP_DIR}/../Resources"
INDEX_FILE="${RESOURCES_DIR}/index.html"

# Vérifier que le fichier index.html existe
if [ ! -f "${INDEX_FILE}" ]; then
    osascript -e 'display dialog "Erreur: Fichier index.html introuvable" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Ouvrir l'application dans le navigateur par défaut
open "${INDEX_FILE}"
EOF

chmod +x "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

# Créer le fichier Info.plist amélioré
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
    <string>BAKO</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
</dict>
</plist>
EOF

echo "💿 Création du DMG avec présentation..."

# Créer un dossier temporaire pour le DMG
DMG_TEMP="${BUILD_DIR}/dmg-temp"
rm -rf "${DMG_TEMP}"
mkdir -p "${DMG_TEMP}"

# Copier l'app dans le dossier temporaire
cp -R "${APP_BUNDLE}" "${DMG_TEMP}/"

# Créer un lien vers Applications
ln -s /Applications "${DMG_TEMP}/Applications"

# Créer un fichier README
cat > "${DMG_TEMP}/README.txt" << EOF
${APP_NAME} ${APP_VERSION}

Pour installer ${APP_NAME}:
1. Glissez ${APP_NAME}.app dans le dossier Applications
2. Ouvrez Applications et double-cliquez sur ${APP_NAME}.app

Pour désinstaller:
1. Supprimez ${APP_NAME}.app du dossier Applications
EOF

# Créer le DMG avec hdiutil
echo "📦 Création de l'image disque..."
hdiutil create -volname "${APP_NAME}" \
    -srcfolder "${DMG_TEMP}" \
    -ov \
    -format UDZO \
    -imagekey zlib-level=9 \
    "${DMG_PATH}"

# Nettoyer le dossier temporaire
rm -rf "${DMG_TEMP}"

# Obtenir la taille du DMG
DMG_SIZE=$(du -h "${DMG_PATH}" | cut -f1)

echo ""
echo "✅ DMG créé avec succès!"
echo "📦 Fichier: ${DMG_PATH}"
echo "📏 Taille: ${DMG_SIZE}"
echo "📁 Tous les DMG sont dans: ${RELEASE_DMG_DIR}"
echo ""
echo "🎉 Vous pouvez maintenant distribuer ce DMG!"
