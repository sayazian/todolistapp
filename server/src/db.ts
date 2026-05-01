import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDataDirectory = path.resolve(__dirname, "../data");

export type DatabaseConnection = Database.Database;

export function createDatabase(filename = getDefaultDatabasePath()) {
  ensureParentDirectory(filename);

  const database = new Database(filename);
  database.pragma("foreign_keys = ON");
  initializeSchema(database);

  return database;
}

export function initializeSchema(database: DatabaseConnection) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getDefaultDatabasePath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "todolist.sqlite");
  }

  return path.join(defaultDataDirectory, "todolist.sqlite");
}

function ensureParentDirectory(filename: string) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
}
