import Link from "next/link";
import { ArrowDownRight, ArrowRight, AudioLines, Sparkles } from "lucide-react";
import { ArticleCard, ArticleGrid } from "@/components/article-card";
import { SectionHeading } from "@/components/section-heading";
import { categories } from "@/lib/categories";
import { getArticles } from "@/lib/news";

export default async function HomePage() {
  const articles = await getArticles();
  const lead = articles[0];
  const latest = articles.slice(1, 7);
  const openSource = articles.filter((article) => article.category === "open-source").slice(0, 3);
  const topics = [...new Set(articles.flatMap((article) => article.tags).filter(Boolean))].slice(0, 6);
  const trending = topics.length
    ? topics.map((topic) => ({
        topic,
        count: articles.filter((article) => article.tags.includes(topic)).length,
      }))
    : categories.slice(0, 5).map((category) => ({
        topic: category.name,
        count: articles.filter((article) => article.category === category.slug).length,
        slug: category.slug,
      }));

  return (
    <div className="home-page page-wrap">
      <section className="home-intro">
        <div className="issue-line">
          <span><span className="live-dot" /> ÉDITION NUMÉRIQUE</span>
          <span>UNE VEILLE QUI PREND DE LA HAUTEUR</span>
        </div>
        <div className="home-title-row">
          <h1>La tech, <span>avec du recul.</span></h1>
          <p>Les signaux faibles d’aujourd’hui.<br />Les grandes idées de demain.</p>
        </div>
      </section>

      {lead ? (
        <section aria-label="À la une" className="lead-story">
          <div className="lead-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="lead-art-label">SIGNAL EN COURS — FLUX EN DIRECT</span>
            <span className="lead-art-glyph">N<span>.</span></span>
          </div>
          <div className="lead-copy">
            <div className="lead-label"><span className="lead-mark" /> À LA UNE <span className="lead-label-rule" /></div>
            <Link className="category-label" href={`/categorie/${lead.category}`}>{categories.find(({ slug }) => slug === lead.category)?.name}</Link>
            <h2><Link href={`/article/${lead.slug}`}>{lead.title}</Link></h2>
            <p>{lead.summary ?? lead.excerpt ?? "Retrouvez cette actualité et sa source originale."}</p>
            <div className="lead-meta">
              <span>{lead.sourceName}</span>
              <span aria-hidden="true" className="meta-dot" />
              <time dateTime={lead.publishedAt}>{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(lead.publishedAt))}</time>
            </div>
            <Link className="lead-read" href={`/article/${lead.slug}`}>Lire le décryptage <ArrowRight size={16} /></Link>
          </div>
        </section>
      ) : (
        <section className="no-feed-banner">
          <span className="lead-mark" />
          <p>Aucun flux n’a répondu pour le moment. Réessayez plus tard ou vérifiez les sources.</p>
          <Link href="/sources">Voir les sources <ArrowRight size={14} /></Link>
        </section>
      )}

      <div className="editorial-rule" />

      <section className="latest-section">
        <SectionHeading eyebrow="LE FIL DE L’INFO" href="/actualites" title="Les dernières nouvelles" />
        <ArticleGrid articles={latest} emptyMessage="Les articles apparaîtront dès qu’une source publiera son prochain signal." />
      </section>

      <section aria-label="Explorer les catégories" className="category-strip">
        <div className="strip-heading"><span>EXPLORER PAR SUJET</span><ArrowDownRight size={16} /></div>
        <div className="category-list">
          {categories.map((category, index) => (
            <Link className="category-chip" href={`/categorie/${category.slug}`} key={category.slug}>
              <span className={`category-number category-number-${category.color}`}>{String(index + 1).padStart(2, "0")}</span>
              {category.name}
              <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      </section>

      <section className="briefing-panel">
        <div className="briefing-icon"><AudioLines size={23} strokeWidth={1.4} /></div>
        <div className="briefing-content">
          <p className="eyebrow">LE BRIEFING NEXORA <span className="status-pill"><span /> INTELLIGENCE ÉDITORIALE</span></p>
          <h2>Moins de bruit.<br /><span>Plus de signal.</span></h2>
          <p>Un condensé de la veille, lorsque PostgreSQL et une clé IA sont configurés. Pas de résumé automatique sans vérification : chaque information renvoie à sa source.</p>
          <Link className="text-link" href="/briefing">Découvrir le briefing <ArrowRight size={15} /></Link>
        </div>
        <div aria-hidden="true" className="briefing-visual">
          <span className="signal signal-a" /><span className="signal signal-b" /><span className="signal signal-c" />
          <Sparkles size={22} />
        </div>
      </section>

      <section className="trending-section">
        <SectionHeading eyebrow="CE QUI ÉMERGE" href="/tendances" title="Signaux & tendances" />
        <div className="trend-list">
          {trending.length ? trending.map((trend, index) => (
            <Link className="trend-row" href={"slug" in trend ? `/categorie/${trend.slug}` : `/recherche?q=${encodeURIComponent(trend.topic)}`} key={trend.topic}>
              <span className="trend-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="trend-name">{trend.topic}</span>
              <span className="trend-count">{trend.count} article{trend.count > 1 ? "s" : ""}</span>
              <ArrowRight size={15} />
            </Link>
          )) : <p className="muted-copy">Les tendances se dessineront à mesure que les sources seront collectées.</p>}
        </div>
      </section>

      <section className="radar-section">
        <div className="radar-copy">
          <p className="eyebrow">RADAR NEXORA</p>
          <h2>Des idées qui<br />méritent <span>un détour.</span></h2>
          <p>Projets, outils et curiosités repérés dans les flux de veille. À découvrir à la source.</p>
          <Link className="text-link" href="/radar">Explorer le radar <ArrowRight size={15} /></Link>
        </div>
        <div className="radar-cards">
          {openSource.length ? openSource.map((article, index) => (
            <ArticleCard article={article} index={index} key={article.id} variant="compact" />
          )) : articles.slice(0, 3).map((article, index) => (
            <ArticleCard article={article} index={index} key={article.id} variant="compact" />
          ))}
          {!articles.length && <p className="muted-copy">Les projets apparaîtront ici après collecte des flux.</p>}
        </div>
      </section>

      <section className="closing-note">
        <span className="closing-star">✳</span>
        <p>Le futur ne vous attend pas.</p>
        <Link href="/a-propos">Et nous non plus. <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}
