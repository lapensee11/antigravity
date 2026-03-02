/**
 * Dossier BAKO dans Téléchargements : tous les PDF et Excel de l'application y sont enregistrés.
 * En mode navigateur, déclenche un téléchargement classique (le dossier ne peut pas être imposé).
 */

const BAKO_FOLDER = "BAKO";

/**
 * Enregistre un fichier exporté (PDF ou Excel).
 * - Dans l'app Tauri : enregistrement dans Téléchargements/BAKO/
 * - Dans le navigateur : téléchargement avec le nom de fichier suggéré
 */
export async function saveExportFile(filename: string, data: Blob | ArrayBuffer | Uint8Array): Promise<void> {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauri) {
    try {
      const { mkdir, writeFile, BaseDirectory } = await import("@tauri-apps/plugin-fs");
      const { downloadDir, join } = await import("@tauri-apps/api/path");

      const downloadPath = await downloadDir();
      const bakoDir = await join(downloadPath, BAKO_FOLDER);
      const filePath = await join(bakoDir, filename);

      await mkdir(BAKO_FOLDER, { recursive: true, baseDir: BaseDirectory.Download });
      const bytes = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data instanceof ArrayBuffer ? new Uint8Array(data) : data;
      await writeFile(filePath, bytes);
    } catch (e) {
      console.error("Export vers BAKO échoué, fallback téléchargement:", e);
      triggerBrowserDownload(filename, data);
    }
    return;
  }

  triggerBrowserDownload(filename, data);
}

function triggerBrowserDownload(filename: string, data: Blob | ArrayBuffer | Uint8Array): void {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data instanceof ArrayBuffer ? data : new Uint8Array(data)]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Enregistre un PDF (ou autre fichier) dans BAKO puis ouvre le panneau d'impression (macOS) ou le fichier.
 * - Tauri + macOS : enregistre dans BAKO puis lance `open -p` (panneau d'impression système, sans Aperçu).
 * - Tauri autre OS / erreur shell : enregistre puis ouvre le fichier avec l'app par défaut.
 * - Navigateur : ouvre l'URL blob dans un nouvel onglet.
 */
export async function saveExportFileAndOpen(filename: string, data: Blob | ArrayBuffer | Uint8Array): Promise<void> {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauri) {
    try {
      const { mkdir, writeFile, BaseDirectory } = await import("@tauri-apps/plugin-fs");
      const { downloadDir, join } = await import("@tauri-apps/api/path");
      const { openPath } = await import("@tauri-apps/plugin-opener");

      const downloadPath = await downloadDir();
      const fullPath = await join(downloadPath, BAKO_FOLDER, filename);

      await mkdir(BAKO_FOLDER, { recursive: true, baseDir: BaseDirectory.Download });
      const bytes = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data instanceof ArrayBuffer ? new Uint8Array(data) : data;
      await writeFile(fullPath, bytes);
      const isMac = typeof navigator !== "undefined" && (navigator.platform === "MacIntel" || navigator.userAgent.includes("Mac"));
      if (isMac) {
        try {
          const { Command } = await import("@tauri-apps/plugin-shell");
          await Command.create("open-print", ["-p", fullPath]).execute();
          return;
        } catch {
          await openPath(fullPath);
          return;
        }
      }
      await openPath(fullPath);
    } catch (e) {
      console.error("Export / ouverture PDF échoué, fallback téléchargement:", e);
      triggerBrowserDownload(filename, data);
    }
    return;
  }

  const blob =
    data instanceof Blob
      ? data
      : new Blob([data instanceof ArrayBuffer ? data : new Uint8Array(data)]);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Retourne le chemin du dossier d'export BAKO (Tauri uniquement), ou null en navigateur.
 */
export async function getBakoExportDir(): Promise<string | null> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return null;
  try {
    const { downloadDir } = await import("@tauri-apps/api/path");
    const { join } = await import("@tauri-apps/api/path");
    return await join(await downloadDir(), BAKO_FOLDER);
  } catch {
    return null;
  }
}
