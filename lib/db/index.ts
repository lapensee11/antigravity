import * as schema from "./schema";

export async function getLocalDB() {
    if (typeof window !== "undefined") return null;

    try {
        // Use dynamic imports to prevent bundling in client-side static export
        const { drizzle } = await import("drizzle-orm/better-sqlite3");
        const Database = (await import("better-sqlite3")).default;

        const sqlite = new Database("bakery.db");
        return drizzle(sqlite, { schema });
    } catch (e) {
        console.error("Local DB initialization error:", e);
        return null;
    }
}

// Keep an empty export for 'db' to avoid breaking existing imports (TEMPORARILY)
// but it will be null on the client.
export const db = null as any;
export { schema };
