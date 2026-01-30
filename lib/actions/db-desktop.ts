import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

export async function getDesktopDB() {
    if (dbInstance) return dbInstance;

    // Load the database from the application data directory
    // Tauri will handle the file path based on the OS
    dbInstance = await Database.load("sqlite:bakery.db");

    // Create tables if they don't exist (Simplified schema for bridge)
    // In a real pro setup, we would run migrations here
    return dbInstance;
}

export const isTauri = () => {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};
