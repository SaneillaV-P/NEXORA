import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleGrid } from "@/components/article-card";
import { categories } from "@/lib/categories";
import { getArticles } from "@/lib/news";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  return { title: category?.name ?? "Catégorie introuvable" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const articles = (await getArticles()).filter((article) => article.category === category.slug);
  return (
    <div className="page-wrap inner-page">
      <div className="page-topline"><Link href="/actualites">ACTUALITÉS</Link><span>/</span>{category.name.toUpperCase()}</div>
      <header className="page-intro">
        <p className="eyebrow">THÈME NEXORA · {category.short.toUpperCase()}</p>
        <h1>{category.name}<span className="title-period">.</span></h1>
        <p>Une sélection d’articles issus de sources identifiées.</p>
      </header>
      <ArticleGrid articles={articles} emptyMessage="Aucun article collecté dans cette catégorie. Explorez les autres sujets ou revenez plus tard." />
    </div>
  );
}
