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

// Use connection pooling URL for better stability
let poolUrl = databaseUrl;
if (databaseUrl.includes('.us-east-2') && !databaseUrl.includes('-pooler')) {
  poolUrl = databaseUrl.replace('.us-east-2', '-pooler.us-east-2');
}

export const pool = new Pool({ 
  connectionString: poolUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000,
});
export const db = drizzle({ client: pool, schema });

export async function testDatabaseConnection(): Promise<boolean> {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✓ Database connection successful');
      return true;
    } catch (error: any) {
      retryCount++;
      console.error(`✗ Database connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error('Check your DATABASE_URL in Secrets and ensure it includes the correct password');
        console.error('You may need to reset your database password in the Replit Database tab');
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
    }
  }
  return false;
}