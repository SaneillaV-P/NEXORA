import type { CategorySlug } from "@/lib/categories";

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  excerpt: string | null;
  canonicalUrl: string;
  publishedAt: string;
  /** Site that published the original article, as indicated by its canonical URL. */
  sourceName: string;
  sourceUrl: string;
  /** Feed or API that discovered the article. */
  feedName: string;
  category: CategorySlug;
  tags: string[];
  clusterId: string | null;
}

export interface FeedSource {
  id: string;
  name: string;
  provider: "rss" | "hacker-news";
  feedUrl: string;
  websiteUrl: string;
  category: CategorySlug;
  description: string;
}
