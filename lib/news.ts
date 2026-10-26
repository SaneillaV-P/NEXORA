import { cache } from "react";
import { desc, eq, ilike, or } from "drizzle-orm";
import { categories as categoryDefinitions } from "@/lib/categories";
import { db } from "@/lib/db";
import { articles as articleTable, sources as sourceTable } from "@/lib/db/schema";
import { collectFeeds } from "@/lib/feeds";
import { sources } from "@/lib/sources";
import type { NewsArticle } from "@/lib/types";

export const getArticles = cache(async (): Promise<NewsArticle[]> => {
  if (!db) {
    return (await collectFeeds()).articles;
  }

  const rows = await db
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
    .orderBy(desc(articleTable.publishedAt))
    .limit(250);

  return rows.map((row) => ({
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    category: categoryDefinitions.some((category) => category.slug === row.category)
      ? (row.category as NewsArticle["category"])
      : "developpement",
  }));
});

export async function findArticle(slug: string): Promise<NewsArticle | undefined> {
  const all = await getArticles();
  return all.find((article) => article.slug === slug);
}

export async function searchArticles(query: string): Promise<NewsArticle[]> {
  const normalized = query.trim().slice(0, 120);
  const all = await getArticles();
  if (!normalized) return all;
  const localMatches = all.filter((article) =>
    `${article.title} ${article.excerpt ?? ""} ${article.summary ?? ""} ${article.tags.join(" ")}`
      .toLocaleLowerCase("fr")
      .includes(normalized.toLocaleLowerCase("fr")),
  );
  if (!db || localMatches.length > 0) return localMatches;

  const pattern = `%${normalized.replace(/[%_\\]/g, "\\$&")}%`;
  const rows = await db
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
    .where(or(ilike(articleTable.title, pattern), ilike(articleTable.excerpt, pattern)))
    .orderBy(desc(articleTable.publishedAt))
    .limit(100);
  return rows.map((row) => ({
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    category: categoryDefinitions.some((category) => category.slug === row.category)
      ? (row.category as NewsArticle["category"])
      : "developpement",
  }));
}

export function getSourceList() {
  return sources;
}
