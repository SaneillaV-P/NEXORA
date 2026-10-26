import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

const databaseUrl = process.env.DATABASE_URL;

export const db = databaseUrl
  ? new URL(databaseUrl).hostname.endsWith(".neon.tech")
    ? drizzleNeon(neon(databaseUrl), { schema })
    : drizzlePostgres(postgres(databaseUrl, { max: 5, connect_timeout: 10 }), { schema })
  : null;
