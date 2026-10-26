import { createHash } from "node:crypto";
import type { NewsArticle } from "@/lib/types";

const ignoredWords = new Set([
  "about", "after", "against", "avec", "dans", "from", "have", "into", "leurs",
  "mais", "more", "over", "pour", "that", "this", "their", "the", "une", "with",
]);

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !ignoredWords.has(word)),
  );
}

export function clusterSimilarArticles(articles: NewsArticle[]): Map<string, string> {
  const parents = articles.map((_, index) => index);
  const find = (index: number): number => {
    if (parents[index] !== index) parents[index] = find(parents[index]);
    return parents[index];
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  const tokens = articles.map((article) => titleTokens(article.title));

  for (let left = 0; left < articles.length; left += 1) {
    for (let right = left + 1; right < articles.length; right += 1) {
      if (tokens[left].size < 2 || tokens[right].size < 2) continue;
      const shared = [...tokens[left]].filter((token) => tokens[right].has(token)).length;
      const unionSize = tokens[left].size + tokens[right].size - shared;
      if (shared >= 2 && shared / unionSize >= 0.65) union(left, right);
    }
  }

  const groups = new Map<number, string[]>();
  articles.forEach((article, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), article.id]);
  });

  const clusters = new Map<string, string>();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    const clusterId = createHash("sha256").update([...ids].sort().join("\n")).digest("hex").slice(0, 16);
    for (const id of ids) clusters.set(id, clusterId);
  }
  return clusters;
}
