import Link from "next/link";
import { ArticleGrid } from "@/components/article-card";
import { Pagination } from "@/components/pagination";
import { categories } from "@/lib/categories";
import { getArticles } from "@/lib/news";

type PageProps = {
  searchParams: Promise<{ category?: string; page?: string; sort?: string }>;
};

export const metadata = { title: "Actualités" };

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const allArticles = await getArticles();
  const category = categories.find(({ slug }) => slug === params.category);
  const filtered = allArticles
    .filter((article) => !category || article.category === category.slug)
    .sort((a, b) => params.sort === "ancien" ? Date.parse(a.publishedAt) - Date.parse(b.publishedAt) : Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page-wrap inner-page">
      <div className="page-topline"><span className="live-dot" /> LA VEILLE, EN TEMPS RÉEL</div>
      <header className="page-intro">
        <p className="eyebrow">LE FIL NEXORA</p>
        <h1>Actualités<span className="title-period">.</span></h1>
        <p>Les signaux du monde numérique, sélectionnés à la source.</p>
      </header>
      <div className="filter-row">
        <nav aria-label="Filtrer les catégories" className="filter-chips">
          <Link className={!category ? "filter-chip active" : "filter-chip"} href="/actualites">Tout</Link>
          {categories.map((item) => (
            <Link className={category?.slug === item.slug ? "filter-chip active" : "filter-chip"} href={`/actualites?category=${item.slug}`} key={item.slug}>{item.name}</Link>
          ))}
        </nav>
        <form action="/actualites" className="sort-form">
          {category && <input name="category" type="hidden" value={category.slug} />}
          <label htmlFor="sort">Trier</label>
          <select defaultValue={params.sort === "ancien" ? "ancien" : "recent"} id="sort" name="sort">
            <option value="recent">Plus récentes</option>
            <option value="ancien">Plus anciennes</option>
          </select>
          <button type="submit">Appliquer</button>
        </form>
      </div>
      <p className="results-count">{filtered.length} actualité{filtered.length !== 1 ? "s" : ""} collectée{filtered.length !== 1 ? "s" : ""}</p>
      <ArticleGrid articles={visible} emptyMessage="Aucun article dans cette catégorie pour le moment. Les flux sont interrogés automatiquement." />
      <Pagination page={page} query={new URLSearchParams({ ...(category ? { category: category.slug } : {}), ...(params.sort ? { sort: params.sort } : {}) }).toString()} totalPages={totalPages} />
    </div>
  );
}
