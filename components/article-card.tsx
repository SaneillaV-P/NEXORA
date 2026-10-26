import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BookmarkButton } from "@/components/bookmark-button";
import { getCategoryName } from "@/lib/categories";
import type { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ArticleCard({
  article,
  variant = "standard",
  index,
}: {
  article: NewsArticle;
  variant?: "standard" | "featured" | "compact";
  index?: number;
}) {
  return (
    <article className={`article-card article-card-${variant}`}>
      <div className="card-kicker">
        <Link className="category-label" href={`/categorie/${article.category}`}>
          {getCategoryName(article.category)}
        </Link>
        <BookmarkButton articleId={article.id} />
      </div>
      {index !== undefined && <span className="card-index">{String(index + 1).padStart(2, "0")}</span>}
      <h3>
        <Link href={`/article/${article.slug}`}>{article.title}</Link>
      </h3>
      {(article.summary || article.excerpt) && (
        <p className="card-excerpt">{article.summary ?? article.excerpt}</p>
      )}
      <div className="card-meta">
        <span>{article.sourceName}</span>
        {article.feedName !== article.sourceName && (
          <span className="feed-source-label">via {article.feedName}</span>
        )}
        <span aria-hidden="true" className="meta-dot" />
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        <Link
          aria-label={`Lire l’article ${article.title}`}
          className="card-arrow"
          href={`/article/${article.slug}`}
        >
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export function ArticleGrid({
  articles,
  emptyMessage = "Aucune actualité ne correspond à cette sélection.",
}: {
  articles: NewsArticle[];
  emptyMessage?: string;
}) {
  if (!articles.length) {
    return <div className="empty-state"><p>{emptyMessage}</p></div>;
  }
  return (
    <div className="article-grid">
      {articles.map((article, index) => (
        <ArticleCard article={article} index={index} key={article.id} />
      ))}
    </div>
  );
}
