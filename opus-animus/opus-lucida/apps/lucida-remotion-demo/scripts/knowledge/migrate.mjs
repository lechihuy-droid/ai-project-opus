#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertSupportedNodeVersion } from "../check-node-version.mjs";
import { assertDatabaseIntegrity, databasePath, openDatabase, withTransaction } from "./sqlite-client.mjs";
import { sha256 } from "./index-utils.mjs";

const migrationPattern = /^(\d+)-[a-z0-9-]+\.sql$/;

const readMigrations = (migrationsDir) => fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && migrationPattern.test(entry.name))
  .map((entry) => ({
    version: entry.name,
    source: fs.readFileSync(path.join(migrationsDir, entry.name), "utf8"),
  }))
  .sort((left, right) => left.version.localeCompare(right.version, "en"));

const readAppliedMigrations = (database) => {
  const exists = database.prepare(
    "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
  ).get();
  if (!exists) {
    return new Map();
  }
  return new Map(database.prepare("SELECT version, checksum FROM schema_migrations").all()
    .map((row) => [row.version, row.checksum]));
};

export const migrateDatabase = ({ appRoot = process.cwd(), dbPath = databasePath(appRoot) } = {}) => {
  assertSupportedNodeVersion(process.version);
  const migrationsDir = path.join(appRoot, "design", "storage", "migrations");
  const migrations = readMigrations(migrationsDir);
  if (migrations.length === 0) {
    throw new Error(`No SQLite migrations found in ${migrationsDir}.`);
  }

  const database = openDatabase(dbPath);
  try {
    const applied = readAppliedMigrations(database);
    for (const migration of migrations) {
      const checksum = sha256(migration.source);
      const recordedChecksum = applied.get(migration.version);
      if (recordedChecksum) {
        if (recordedChecksum !== checksum) {
          throw new Error(`Migration checksum mismatch: ${migration.version}.`);
        }
        continue;
      }

      withTransaction(database, () => {
        database.exec(migration.source);
        database.prepare(
          "INSERT INTO schema_migrations(version, checksum) VALUES (?, ?)",
        ).run(migration.version, checksum);
        const foreignKeyViolations = database.prepare("PRAGMA foreign_key_check").all();
        if (foreignKeyViolations.length > 0) {
          throw new Error(`Migration foreign key check failed: ${JSON.stringify(foreignKeyViolations)}`);
        }
      });
      applied.set(migration.version, checksum);
    }
    assertDatabaseIntegrity(database);
    return {
      applied: migrations.length,
      database: dbPath,
    };
  } finally {
    database.close();
  }
};

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    const result = migrateDatabase();
    console.log(`SQLite migrations passed: ${result.applied} migration(s), ${result.database}.`);
  } catch (error) {
    console.error(`SQLite migration failed: ${error.message}`);
    process.exitCode = 1;
  }
}
