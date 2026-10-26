import type { Metadata } from "next";
import { ArticleGrid } from "@/components/article-card";
import { SearchForm } from "@/components/search-form";
import { searchArticles } from "@/lib/news";

type PageProps = { searchParams: Promise<{ q?: string }> };

export const metadata: Metadata = { title: "Recherche" };

export default async function SearchPage({ searchParams }: PageProps) {
  const query = ((await searchParams).q ?? "").slice(0, 120);
  const articles = query ? await searchArticles(query) : [];
  return (
    <div className="page-wrap inner-page search-page">
      <div className="page-topline"><span className="live-dot" /> EXPLORER LA VEILLE</div>
      <header className="page-intro">
        <p className="eyebrow">RECHERCHE NEXORA</p>
        <h1>Qu’est-ce qui<br />vous <span className="title-soft">interpelle ?</span></h1>
        <p>Parcourez les articles collectés et leurs sources.</p>
      </header>
      <SearchForm initialQuery={query} />
      {query && <p className="results-count">{articles.length} résultat{articles.length !== 1 ? "s" : ""} pour « {query} »</p>}
      {query && <ArticleGrid articles={articles} emptyMessage="Aucun résultat. Essayez un autre terme ou vérifiez l’orthographe." />}
    </div>
  );
}
