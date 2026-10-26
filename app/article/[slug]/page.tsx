import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { ArticleGrid } from "@/components/article-card";
import { BookmarkButton } from "@/components/bookmark-button";
import { getCategoryName } from "@/lib/categories";
import { getAiStatus } from "@/lib/ai-provider";
import { getArticles, findArticle } from "@/lib/news";
import { formatDate } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await findArticle((await params).slug);
  if (!article) return { title: "Article introuvable" };
  return {
    title: article.title,
    description: article.summary ?? article.excerpt ?? `Actualité publiée par ${article.sourceName}.`,
    openGraph: { title: article.title, description: article.summary ?? article.excerpt ?? undefined, type: "article" },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const aiStatus = getAiStatus();
  const article = await findArticle((await params).slug);
  if (!article) notFound();
  const allArticles = await getArticles();
  const clustered = article.clusterId
    ? allArticles.filter((item) => item.id !== article.id && item.clusterId === article.clusterId)
    : [];
  const related = (clustered.length
    ? clustered
    : allArticles.filter((item) => item.id !== article.id && item.category === article.category)
  ).slice(0, 3);
  return (
    <div className="page-wrap article-page">
      <Link className="back-link" href="/actualites"><ArrowLeft size={14} /> Toutes les actualités</Link>
      <article>
        <header className="article-header">
          <div className="article-category-row">
            <Link className="category-label" href={`/categorie/${article.category}`}>{getCategoryName(article.category)}</Link>
            <span className="article-divider" />
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
          <h1>{article.title}</h1>
          <div className="article-deck-row">
            <p>{article.summary ?? article.excerpt ?? "La source d’origine ne fournit pas d’extrait pour cette actualité."}</p>
            <BookmarkButton articleId={article.id} />
          </div>
          <div className="article-byline">
            <span>À LA SOURCE <b>{article.sourceName}</b></span>
            {article.feedName !== article.sourceName && (
              <span>REPÉRÉ VIA <b>{article.feedName}</b></span>
            )}
          </div>
        </header>
        <div className="article-rule" />
        <div className="article-body">
          <div className="article-summary-label"><Sparkles size={15} /> {article.summary ? "SYNTHÈSE NEXORA · IA" : "EXTRAIT DE LA SOURCE"}</div>
          <p className="article-excerpt">{article.summary ?? article.excerpt ?? "Aucun extrait n’est fourni dans le flux RSS."}</p>
          {!article.summary && aiStatus.configured && (
            <p className="ai-status-note">Cette actualité n’a pas encore été traitée par le pipeline IA. Sa source originale reste accessible ci-dessous.</p>
          )}
          {!aiStatus.configured && (
            <p className="ai-status-note">
              Résumé IA désactivé.
              {aiStatus.keyVariable
                ? <> Configurez <code>AI_PROVIDER={aiStatus.provider}</code> et <code>{aiStatus.keyVariable}</code> pour l’activer.</>
                : <> Sélectionnez un fournisseur avec <code>AI_PROVIDER</code> pour l’activer.</>}
            </p>
          )}
          <a className="source-cta" href={article.canonicalUrl} rel="noreferrer" target="_blank">
            Lire l’article original sur {article.sourceName} <ArrowUpRight size={16} />
          </a>
          <p className="source-disclaimer">NEXORA conserve le titre, la date et un court extrait du flux. Le contenu intégral reste hébergé par sa source.</p>
        </div>
      </article>
      {related.length > 0 && (
        <section className="related-articles">
          <div className="section-heading"><div><p className="eyebrow">POUR ALLER PLUS LOIN</p><h2>Dans le même sujet</h2></div></div>
          <ArticleGrid articles={related} />
        </section>
      )}
    </div>
  );
}
