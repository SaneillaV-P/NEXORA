import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/ai-provider";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const aiStatus = getAiStatus();
  let storage: "connected" | "unavailable" | "not_configured" = db
    ? "unavailable"
    : "not_configured";
  if (db) {
    try {
      await db.execute(sql`select 1`);
      storage = "connected";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de connexion PostgreSQL.";
      console.error("[NEXORA] Vérification PostgreSQL échouée:", message);
      return NextResponse.json(
        {
          status: "degraded",
          storage,
          ai: aiStatus.configured ? "configured" : "not_configured",
          aiProvider: aiStatus.provider,
        },
        { status: 503 },
      );
    }
  }
  return NextResponse.json({
    status: "ok",
    storage,
    ai: aiStatus.configured ? "configured" : "not_configured",
    aiProvider: aiStatus.provider,
  });
}
