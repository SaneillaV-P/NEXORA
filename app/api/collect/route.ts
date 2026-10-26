import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createDailyBriefing } from "@/lib/briefing";
import { runCollection } from "@/lib/collection";

export const runtime = "nodejs";
export const maxDuration = 60;

let rateWindowStarted = 0;
let requestsInWindow = 0;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!secret || !supplied) return false;
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = Date.now();
  if (now - rateWindowStarted >= 60_000) {
    rateWindowStarted = now;
    requestsInWindow = 0;
  }
  requestsInWindow += 1;
  if (requestsInWindow > 3) {
    return NextResponse.json({ error: "Limite atteinte. Réessayez dans une minute." }, { status: 429 });
  }

  try {
    const result = await runCollection();
    let briefingCreated = false;
    if (result.errors.length < 5) briefingCreated = await createDailyBriefing();
    console.info("[NEXORA] Collecte terminée", {
      fetched: result.fetched,
      inserted: result.inserted,
      failures: result.errors.length,
      aiErrors: result.aiErrors,
      aiProvider: result.aiProvider,
      briefingCreated,
    });
    const status = result.errors.length === 5 && result.fetched === 0 ? 502 : 200;
    return NextResponse.json({ ...result, briefingCreated }, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne de collecte.";
    console.error("[NEXORA] Échec de la collecte", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
