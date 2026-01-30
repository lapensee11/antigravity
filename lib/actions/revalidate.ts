export async function safeRevalidate(path: string) {
    // revalidatePath only works on the server-side (Node.js)
    // In a static export or Tauri environment, it's a no-op.
    if (typeof window === "undefined") {
        try {
            // Use dynamic import to prevent bundling in client-side static export
            const { revalidatePath } = await import("next/cache");
            revalidatePath(path);
        } catch (e) {
            // Ignore if next/cache is not available (e.g. during static build phase)
        }
    }
}
