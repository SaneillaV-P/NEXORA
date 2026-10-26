import { describe, expect, it } from "vitest";
import { clusterSimilarArticles } from "@/lib/grouping";
import type { NewsArticle } from "@/lib/types";

function article(id: string, title: string): NewsArticle {
  return {
    id,
    slug: id,
    title,
    summary: null,
    excerpt: null,
    canonicalUrl: `https://example.test/${id}`,
    publishedAt: "2026-10-26T00:00:00.000Z",
    sourceName: "Source de test",
    sourceUrl: "https://example.test/",
    feedName: "Source de test",
    category: "developpement",
    tags: [],
    clusterId: null,
  };
}

describe("similar article grouping", () => {
  it("groups strongly overlapping headlines and leaves distinct ones apart", () => {
    const items = [
      article("one", "Rust compiler adds faster incremental compilation"),
      article("two", "Faster incremental compilation arrives in Rust compiler"),
      article("three", "New satellite imagery maps ocean temperatures"),
    ];
    const clusters = clusterSimilarArticles(items);
    expect(clusters.get("one")).toBe(clusters.get("two"));
    expect(clusters.has("three")).toBe(false);
  });
});
