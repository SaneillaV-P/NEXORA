import Link from "next/link";
import { ArrowUpRight, Radar } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { getArticles } from "@/lib/news";

export const metadata = { title: "Radar" };

export default async function RadarPage() {
  const all = await getArticles();
  const articles = all.filter((article) => ["open-source", "developpement", "hardware"].includes(article.category));
  return (
    <div className="page-wrap inner-page">
      <div className="page-topline"><Radar size={13} /> OBJETS NON IDENTIFIÉS, MAIS BIEN RÉELS</div>
      <header className="page-intro">
        <p className="eyebrow">RADAR NEXORA</p>
        <h1>À garder<br /><span className="title-soft">dans son radar.</span></h1>
        <p>Projets, outils et idées repérés dans nos flux. Chaque signal pointe vers sa publication d’origine.</p>
      </header>
      {articles.length ? (
        <div className="radar-grid">
          {articles.map((article, index) => (
            <div className="radar-card" key={article.id}>
              <span className="radar-card-index">REPÉRAGE N° {String(index + 1).padStart(2, "0")}</span>
              <ArticleCard article={article} variant="compact" />
              <Link className="radar-source" href={article.canonicalUrl} rel="noreferrer" target="_blank">Ouvrir la source <ArrowUpRight size={13} /></Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><p>Le radar se remplit à partir des articles réels collectés. Aucun projet n’est ajouté manuellement.</p></div>
      )}
    </div>
  );
}
