import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const SQLITE_SCHEMA_VERSION = "lucida-knowledge-sqlite/v1";
export const DATABASE_FILE = "lucida-knowledge.db";

export const knowledgeDirectory = (appRoot = process.cwd()) => path.join(appRoot, ".generated", "knowledge");
export const databasePath = (appRoot = process.cwd()) => path.join(knowledgeDirectory(appRoot), DATABASE_FILE);

export const normalizeSearchText = (value) => String(value ?? "").normalize("NFC").toLowerCase();

export const foldSearchText = (value) => normalizeSearchText(value)
  .normalize("NFD")
  .replace(/\p{M}/gu, "")
  .replace(/đ/g, "d")
  .replace(/[\p{P}\p{S}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();

export const openDatabase = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const foreignKeys = database.prepare("PRAGMA foreign_keys").get();
  if (foreignKeys.foreign_keys !== 1) {
    database.close();
    throw new Error("SQLite foreign key enforcement could not be enabled.");
  }
  return database;
};

export const withTransaction = (database, operation) => {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = operation();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // The original error explains the failed statement.
    }
    throw error;
  }
};

export const rebuildSearchFts = (database) => {
  database.exec("INSERT INTO search_fts(search_fts) VALUES ('rebuild')");
};

export const assertDatabaseIntegrity = (database) => {
  const foreignKeyViolations = database.prepare("PRAGMA foreign_key_check").all();
  if (foreignKeyViolations.length > 0) {
    throw new Error(`SQLite foreign key check failed: ${JSON.stringify(foreignKeyViolations)}`);
  }

  const integrityRows = database.prepare("PRAGMA integrity_check").all();
  if (integrityRows.length !== 1 || integrityRows[0].integrity_check !== "ok") {
    throw new Error(`SQLite integrity check failed: ${JSON.stringify(integrityRows)}`);
  }

  database.exec("INSERT INTO search_fts(search_fts) VALUES ('integrity-check')");
};

export const projectionRowCounts = (database) => Object.fromEntries(
  [
    "projection_builds",
    "canonical_entities",
    "entity_capabilities",
    "entity_relations",
    "validation_artifacts",
    "sources",
    "source_snapshots",
    "provenance_records",
    "documents",
    "chunks",
    "observations",
    "search_documents",
    "search_fts",
  ].map((table) => [table, database.prepare(`SELECT count(*) AS count FROM ${table}`).get().count]),
);
