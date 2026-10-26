import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { categories } from "@/lib/categories";
import { getArticles } from "@/lib/news";

export const metadata = { title: "Tendances" };

export default async function TrendsPage() {
  const articles = await getArticles();
  const byCategory = categories
    .map((category) => ({
      ...category,
      count: articles.filter((article) => article.category === category.slug).length,
      latest: articles.find((article) => article.category === category.slug),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const maximum = Math.max(1, ...byCategory.map((item) => item.count));

  return (
    <div className="page-wrap inner-page">
      <div className="page-topline"><TrendingUp size={13} /> OBSERVATION DES FLUX</div>
      <header className="page-intro">
        <p className="eyebrow">LES SIGNAUX SE DESSINENT</p>
        <h1>Tendances<span className="title-period">.</span></h1>
        <p>Une lecture des sujets présents dans les articles collectés. Aucune projection ni donnée inventée.</p>
      </header>
      {byCategory.length ? (
        <div className="trend-dashboard">
          <p className="data-note">RÉPARTITION DES {articles.length} ARTICLES DISPONIBLES · COMPTAGE PAR CATÉGORIE ÉDITORIALE</p>
          {byCategory.map((category, index) => (
            <Link className="trend-bar-row" href={`/categorie/${category.slug}`} key={category.slug}>
              <span className="trend-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="trend-bar-name">{category.name}</span>
              <span aria-label={`${category.count} articles`} className="trend-bar-track"><span style={{ width: `${Math.max(5, (category.count / maximum) * 100)}%` }} /></span>
              <span className="trend-count">{category.count}</span>
              <ArrowRight size={14} />
            </Link>
          ))}
          <p className="insights-caveat">Ces volumes reflètent uniquement les articles disponibles dans la fenêtre de collecte actuelle. Ils ne constituent pas une mesure de popularité générale.</p>
        </div>
      ) : (
        <div className="empty-state"><p>Les tendances apparaîtront quand les flux auront fourni des articles.</p></div>
      )}
      <section className="trend-recent">
        <div className="section-heading"><div><p className="eyebrow">DERNIERS SIGNAUX</p><h2>À surveiller</h2></div></div>
        {byCategory.slice(0, 3).map((item) => item.latest && (
          <Link className="trend-row" href={`/article/${item.latest.slug}`} key={item.slug}>
            <span className="trend-index">{item.short}</span><span className="trend-name">{item.latest.title}</span><span className="trend-count">{item.latest.sourceName}</span><ArrowRight size={14} />
          </Link>
        ))}
      </section>
    </div>
  );
}
