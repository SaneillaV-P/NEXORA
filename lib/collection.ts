import { createHash, randomUUID } from "node:crypto";
import { asc, eq, inArray, isNull } from "drizzle-orm";
import { categories } from "@/lib/categories";
import { enrichArticle } from "@/lib/ai";
import { getAiStatus } from "@/lib/ai-provider";
import { db } from "@/lib/db";
import {
  articles as articleTable,
  categories as categoryTable,
  processingLogs,
  sources as sourceTable,
} from "@/lib/db/schema";
import { collectFeeds } from "@/lib/feeds";
import type { NewsArticle } from "@/lib/types";
import { sources } from "@/lib/sources";
import { toSlug } from "@/lib/utils";

export const AI_ARTICLES_PER_COLLECTION = 3;

export async function runCollection(): Promise<{
  fetched: number;
  inserted: number;
  errors: Array<{ source: string; error: string }>;
  aiEnabled: boolean;
  aiConfigured: boolean;
  aiProvider: ReturnType<typeof getAiStatus>["provider"];
  aiErrors: number;
  storageConfigured: boolean;
}> {
  const startedAt = Date.now();
  const result = await collectFeeds();
  let inserted = 0;
  let aiErrors = 0;
  const aiStatus = getAiStatus();
  const aiEnabled = aiStatus.configured;

  if (db) {
    await db
      .insert(categoryTable)
      .values(categories.map(({ slug, name }) => ({ slug, name, description: name })))
      .onConflictDoNothing();
    await db
      .insert(sourceTable)
      .values(sources.map((source) => ({
        id: source.id,
        name: source.name,
        feedUrl: source.feedUrl,
        websiteUrl: source.websiteUrl,
        categorySlug: source.category,
      })))
      .onConflictDoNothing();

    const batch = result.articles;
    const existingRows = batch.length
      ? await db
        .select({ canonicalUrl: articleTable.canonicalUrl })
        .from(articleTable)
        .where(inArray(articleTable.canonicalUrl, batch.map((article) => article.canonicalUrl)))
      : [];
    const knownUrls = new Set(existingRows.map((row) => row.canonicalUrl));
    await db
      .insert(articleTable)
      .values(batch.map(toDatabaseValues))
      .onConflictDoNothing();
    inserted = batch.filter((article) => !knownUrls.has(article.canonicalUrl)).length;

    if (aiEnabled) {
      const pending = await db
        .select({
          id: articleTable.id,
          slug: articleTable.slug,
          title: articleTable.title,
          summary: articleTable.summary,
          excerpt: articleTable.excerpt,
          canonicalUrl: articleTable.canonicalUrl,
          sourceName: articleTable.sourceName,
          sourceUrl: articleTable.sourceUrl,
          feedName: sourceTable.name,
          publishedAt: articleTable.publishedAt,
          category: articleTable.categorySlug,
          tags: articleTable.tags,
          clusterId: articleTable.clusterId,
        })
        .from(articleTable)
        .innerJoin(sourceTable, eq(articleTable.sourceId, sourceTable.id))
        .where(isNull(articleTable.summary))
        .orderBy(asc(articleTable.createdAt))
        .limit(AI_ARTICLES_PER_COLLECTION);
      for (const row of pending) {
        const article: NewsArticle = {
          ...row,
          publishedAt: row.publishedAt.toISOString(),
          category: categories.some((category) => category.slug === row.category)
            ? (row.category as NewsArticle["category"])
            : "developpement",
        };
        try {
          const analysis = await enrichArticle(article);
          if (analysis) {
            await db
              .update(articleTable)
              .set({
                summary: analysis.summary,
                categorySlug: analysis.category,
                tags: analysis.tags,
                entities: analysis.entities,
                aiProcessedAt: new Date(),
              })
              .where(eq(articleTable.id, article.id));
          }
        } catch (error) {
          aiErrors += 1;
          const message = error instanceof Error ? error.message : "Erreur IA inconnue.";
          console.error(`[NEXORA] Traitement IA échoué pour ${article.canonicalUrl}: ${message}`);
          await db.insert(processingLogs).values({
            id: randomUUID(),
            sourceId: sources.find((source) => source.name === article.feedName)?.id ?? null,
            status: "ai_error",
            message,
            itemCount: 1,
            durationMs: Date.now() - startedAt,
          });
        }
      }
    }
  }

  if (db) {
    for (const source of sources) {
      const error = result.errors.find((item) => item.source === source.name);
      const fetchedForSource = result.articles.filter((article) => article.feedName === source.name).length;
      await db
        .insert(processingLogs)
        .values({
          id: randomUUID(),
          sourceId: source.id,
          status: error ? "error" : "success",
          message: error?.error ?? "Flux récupéré.",
          itemCount: fetchedForSource,
          durationMs: Date.now() - startedAt,
        });
    }
  }

  return {
    fetched: result.articles.length,
    inserted,
    errors: result.errors,
    aiEnabled: Boolean(db && aiEnabled),
    aiConfigured: aiStatus.configured,
    aiProvider: aiStatus.provider,
    aiErrors,
    storageConfigured: Boolean(db),
  };
}

function toDatabaseValues(article: NewsArticle) {
  const suffix = createHash("sha256").update(article.canonicalUrl).digest("hex").slice(0, 12);
  return {
    id: article.id,
    slug: `${toSlug(article.title)}-${suffix}`,
    title: article.title,
    summary: null,
    excerpt: article.excerpt,
    canonicalUrl: article.canonicalUrl,
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl,
    publishedAt: new Date(article.publishedAt),
    sourceId: sources.find((source) => source.name === article.feedName)?.id ?? "hacker-news",
    categorySlug: article.category,
    tags: article.tags,
    entities: [],
    clusterId: article.clusterId,
    aiProcessedAt: null,
  };
}
