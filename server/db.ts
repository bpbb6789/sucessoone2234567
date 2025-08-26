import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debug: Log the first part of the DATABASE_URL to verify it's loaded
console.log("DATABASE_URL loaded:", process.env.DATABASE_URL ? "✓" : "✗");
console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20) + "...");

// Use connection pooling for better stability with Neon
const databaseUrl = process.env.DATABASE_URL;

// Check if URL already contains 'pooler' to avoid double modification
let poolUrl = databaseUrl;
if (databaseUrl && !databaseUrl.includes('pooler')) {
  poolUrl = databaseUrl.replace('.us-east-1', '-pooler.us-east-1').replace('.us-east-2', '-pooler.us-east-2');
}

export const pool = new Pool({
  connectionString: poolUrl,
  ssl: {
    rejectUnauthorized: false
  },
  // Add connection timeout and retry logic
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});
export const db = drizzle({ client: pool, schema });

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    console.error('Check your DATABASE_URL in Secrets and ensure it includes the correct password');
    return false;
  }
}