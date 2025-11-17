import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { pool } from "../db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaFilePath = path.resolve(__dirname, "../../scripts/init-database.sql");

let cachedSchemaSql: string | null = null;

async function loadSchemaSql() {
  if (!cachedSchemaSql) {
    cachedSchemaSql = await readFile(schemaFilePath, "utf8");
  }
  return cachedSchemaSql;
}

async function truncateTables(client: PoolClient) {
  try {
    await client.query(`
      TRUNCATE TABLE
        order_items,
        orders,
        products,
        users
      RESTART IDENTITY CASCADE;
    `);
  } catch (error: any) {
    if (error?.code === "42P01") {
      // Table does not exist yet; safe to ignore.
      return;
    }
    throw error;
  }
}

async function waitForDatabase(maxRetries = 10, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error}`);
      }
      console.log(`Waiting for database... attempt ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

export async function ensureTestDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run tests.");
  }

  // Aguardar o banco estar pronto
  await waitForDatabase();

  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [4294967]);
    const schemaSql = await loadSchemaSql();
    await client.query(schemaSql);
    await truncateTables(client);
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [4294967]);
    } catch {
      // ignore unlock failures
    }
    client.release();
  }
}
