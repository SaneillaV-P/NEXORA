import { collectFeeds } from "@/lib/feeds";
import { sources } from "@/lib/sources";

const result = await collectFeeds();
const failures = new Map(result.errors.map((error) => [error.source, error.error]));
const articleCounts = new Map<string, number>();

for (const article of result.articles) {
  articleCounts.set(
    article.feedName,
    (articleCounts.get(article.feedName) ?? 0) + 1,
  );
}

console.log("Vérification directe des sources NEXORA\n");
for (const source of sources) {
  const error = failures.get(source.name);
  const count = articleCounts.get(source.name) ?? 0;
  console.log(
    `${error ? "ERREUR" : "OK"} — ${source.name}: ${
      error ?? `${count} article(s) technologiques retenu(s)`
    }`,
  );
}

if (result.articles.length) {
  console.log("\nPremiers articles vérifiés en direct :");
  for (const article of result.articles.slice(0, 10)) {
    console.log(
      `- ${article.publishedAt} | ${article.sourceName} (via ${article.feedName})`,
    );
    console.log(`  ${article.title}`);
    console.log(`  ${article.canonicalUrl}`);
  }
}

console.log(
  `\nBilan : ${result.articles.length} article(s), ${result.errors.length}/${sources.length} source(s) en erreur.`,
);

if (!result.articles.length) {
  process.exitCode = 1;
}
