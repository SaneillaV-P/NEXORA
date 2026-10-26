import Parser from "rss-parser";
import { z } from "zod";
import { sources } from "@/lib/sources";
import type { FeedSource, NewsArticle } from "@/lib/types";
import { clusterSimilarArticles } from "@/lib/grouping";
import { hostnameForUrl, safeHttpUrl, stripMarkup, toSlug } from "@/lib/utils";

const parser = new Parser();

const HACKER_NEWS_STORY_LIMIT = 15;
const HACKER_NEWS_CONCURRENCY = 8;
const hackerNewsStorySchema = z.object({
  id: z.number().int().positive(),
  type: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  time: z.number().int().positive().optional(),
  text: z.string().optional(),
  deleted: z.boolean().optional(),
  dead: z.boolean().optional(),
});
const hackerNewsIdsSchema = z.array(z.number().int().positive());

const categoryKeywords = [
  { slug: "cybersecurite", keywords: ["cybersecurity", "cyber security", "security", "vulnerability", "vulnerabilities", "malware", "ransomware", "data breach", "cve-", "zero-day", "zero day", "prompt injection"] },
  { slug: "intelligence-artificielle", keywords: ["artificial intelligence", "machine learning", "large language model", "language model", "llm", "generative ai", "openai", "anthropic", "claude", "gemini", "neural network", "vllm", "inference", "transformer", "gpu model", "tool call", "tool-call"] },
  { slug: "hardware", keywords: ["hardware", "semiconductor", "chipmaker", "microprocessor", "processor", "gpu", "nvidia", "intel", "amd", "arm chip", "datacenter chip", "data center chip"] },
  { slug: "cloud-devops", keywords: ["cloud", "kubernetes", "devops", "infrastructure", "serverless", "data center", "datacenter", "database", "distributed system", "network protocol"] },
  { slug: "open-source", keywords: ["open source", "open-source", "open source project", "github", "gitlab", "linux kernel", "free software"] },
  { slug: "developpement", keywords: ["software", "developer", "programming", "programmer", "javascript", "typescript", "python", "rust", "linux", "compiler", "programming language", "source code", "code editor", "webassembly", "wasm", "command line", "cli", "browser", "kernel", "api", "web framework", "tool-call", "tool call", "vllm", "web development", "database engine"] },
  { slug: "entreprises", keywords: ["technology company", "tech company", "startup", "acquisition", "ipo", "venture capital", "funding round", "apple", "google", "microsoft", "meta", "amazon", "spacex"] },
] as const;

function normalizedWords(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function classify(
  source: FeedSource,
  title: string,
  excerpt: string | null,
): NewsArticle["category"] | null {
  const text = ` ${normalizedWords(`${title} ${excerpt ?? ""}`)} `;
  const matches = categoryKeywords
    .map((category, order) => ({
      ...category,
      order,
      score: category.keywords.filter((keyword) => {
        const pattern = keyword.trim().split(/[\s-]+/).map((part) =>
          part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ).join("[\\s-]+");
        return new RegExp(`(^|[^a-z0-9])${pattern}($|[^a-z0-9])`).test(text);
      }).length,
    }))
    .filter((category) => category.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);

  if (matches[0]) return matches[0].slug;
  if (source.provider === "hacker-news") return null;
  return source.category;
}

function sourceDetails(
  canonicalUrl: string,
  feedSource: FeedSource,
): { sourceName: string; sourceUrl: string } {
  if (feedSource.provider !== "hacker-news") {
    return { sourceName: feedSource.name, sourceUrl: feedSource.websiteUrl };
  }
  const original = new URL(canonicalUrl);
  const host = hostnameForUrl(canonicalUrl) ?? original.hostname;
  return { sourceName: host, sourceUrl: original.origin };
}

export async function fetchFeed(source: FeedSource): Promise<NewsArticle[]> {
  const feedUrl = source.provider === "hacker-news"
    ? "https://hacker-news.firebaseio.com/v0/topstories.json"
    : source.feedUrl;
  const response = await fetch(feedUrl, {
    headers: { "User-Agent": "NEXORA/1.0 (independent technology news reader)" },
    signal: AbortSignal.timeout(12_000),
    next: { revalidate: 600 },
  });
  if (!response.ok) {
    throw new Error(`Flux ${source.name} indisponible (HTTP ${response.status}).`);
  }
  if (source.provider === "hacker-news") {
    return fetchHackerNewsStories(source, response);
  }
  const feed = await parser.parseString(await response.text());
  const articles: NewsArticle[] = [];

  for (const item of feed.items.slice(0, 15)) {
    const canonicalUrl = safeHttpUrl(item.link);
    const title = stripMarkup(item.title);
    const rawDate = item.isoDate ?? item.pubDate;
    if (!canonicalUrl || !title || !rawDate || Number.isNaN(Date.parse(rawDate))) continue;
    const publishedAt = new Date(rawDate).toISOString();

    const excerpt = normalizeFeedExcerpt(
      item.contentSnippet ?? item.content ?? item.summary,
    );
    const category = classify(source, title, excerpt);
    if (!category) continue;
    const slug = toSlug(title) || "actualite";
    articles.push({
      id: canonicalUrl,
      slug: `${slug}-${source.id}`,
      title,
      summary: null,
      excerpt,
      canonicalUrl,
      publishedAt: new Date(publishedAt).toISOString(),
      ...sourceDetails(canonicalUrl, source),
      feedName: source.name,
      category,
      tags: [],
      clusterId: null,
    });
  }
  return articles;
}

function normalizeFeedExcerpt(value: string | undefined): string | null {
  const withoutFeedMetadata = value?.replace(
    /\b(?:article url|comments url|points|# comments)\s*:.*$/i,
    "",
  );
  return stripMarkup(withoutFeedMetadata);
}

async function fetchHackerNewsStories(
  source: FeedSource,
  response: Response,
): Promise<NewsArticle[]> {
  const idResult = hackerNewsIdsSchema.safeParse(await response.json());
  if (!idResult.success) {
    throw new Error("L’API officielle Hacker News a renvoyé une liste d’articles invalide.");
  }

  const articles: NewsArticle[] = [];
  const ids = idResult.data.slice(0, HACKER_NEWS_STORY_LIMIT);
  let failures = 0;
  for (let index = 0; index < ids.length; index += HACKER_NEWS_CONCURRENCY) {
    const batch = ids.slice(index, index + HACKER_NEWS_CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (id) => {
      const itemResponse = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        {
          headers: { "User-Agent": "NEXORA/1.0 (independent news reader)" },
          signal: AbortSignal.timeout(8_000),
          next: { revalidate: 600 },
        },
      );
      if (!itemResponse.ok) {
        throw new Error(`L’article Hacker News ${id} est indisponible (HTTP ${itemResponse.status}).`);
      }
      const parsed = hackerNewsStorySchema.safeParse(await itemResponse.json());
      if (!parsed.success) {
        throw new Error(`L’API officielle Hacker News a renvoyé des données invalides pour ${id}.`);
      }
      return parsed.data;
    }));

    for (const [resultIndex, result] of results.entries()) {
      if (result.status === "rejected") {
        failures += 1;
        const message = result.reason instanceof Error
          ? result.reason.message
          : "Erreur inconnue de collecte Hacker News.";
        console.error(`[NEXORA] Article Hacker News ${batch[resultIndex]} ignoré: ${message}`);
        continue;
      }
      const item = result.value;
      if (
        item.type !== "story"
        || item.deleted
        || item.dead
        || !item.title
        || !item.url
        || !item.time
      ) continue;
      const canonicalUrl = safeHttpUrl(item.url);
      if (!canonicalUrl) continue;
      const publishedAt = new Date(item.time * 1000);
      if (Number.isNaN(publishedAt.getTime())) continue;
      const excerpt = stripMarkup(item.text);
      const category = classify(source, item.title, excerpt);
      if (!category) continue;
      const { sourceName, sourceUrl } = sourceDetails(canonicalUrl, source);
      const slug = toSlug(item.title) || "actualite";
      articles.push({
        id: canonicalUrl,
        slug: `${slug}-${source.id}`,
        title: stripMarkup(item.title) ?? item.title,
        summary: null,
        excerpt,
        canonicalUrl,
        publishedAt: publishedAt.toISOString(),
        sourceName,
        sourceUrl,
        feedName: source.name,
        category,
        tags: [],
        clusterId: null,
      });
    }
  }
  if (failures > 0 && articles.length === 0) {
    throw new Error(`Impossible de charger les ${failures} premières histoires de Hacker News.`);
  }
  return articles;
}

export async function collectFeeds(
  selectedSources = sources,
): Promise<{ articles: NewsArticle[]; errors: Array<{ source: string; error: string }> }> {
  const articles: NewsArticle[] = [];
  const errors: Array<{ source: string; error: string }> = [];

  const results = await Promise.all(selectedSources.map(async (source) => {
    try {
      return { source, articles: await fetchFeed(source) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue de collecte.";
      console.error(`[NEXORA] Collecte ${source.id} échouée: ${message}`);
      return { source, articles: [], error: message };
    }
  }));
  for (const result of results) {
    articles.push(...result.articles);
    if (result.error) errors.push({ source: result.source.name, error: result.error });
  }

  const unique = new Map<string, NewsArticle>();
  for (const article of articles) {
    const previous = unique.get(article.canonicalUrl);
    if (!previous || (article.excerpt?.length ?? 0) > (previous.excerpt?.length ?? 0)) {
      unique.set(article.canonicalUrl, article);
    }
  }

  const deduplicated = [...unique.values()];
  const clusters = clusterSimilarArticles(deduplicated);
  return {
    articles: deduplicated.map((article) => ({
      ...article,
      clusterId: clusters.get(article.id) ?? null,
    })).sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    ),
    errors,
  };
}
