"use client";

import { useEffect, useState } from "react";
import { BookmarkX } from "lucide-react";
import { ArticleGrid } from "@/components/article-card";
import type { NewsArticle } from "@/lib/types";

const STORAGE_KEY = "nexora:favorites";

export function FavoritesList({ articles }: { articles: NewsArticle[] }) {
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        setIds(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
      } catch {
        setIds([]);
      }
    };
    read();
    window.addEventListener("nexora:favorites-changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("nexora:favorites-changed", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  if (ids === null) return <div aria-label="Chargement des favoris" className="loading-state">Chargement de vos favoris…</div>;
  const saved = articles.filter((article) => ids.includes(article.id));
  if (!saved.length) {
    return (
      <div className="empty-state empty-state-icon">
        <BookmarkX size={23} />
        <p>Vos favoris apparaîtront ici.</p>
        <span>Enregistrez un article avec l’icône marque-page pour le retrouver.</span>
      </div>
    );
  }
  return <ArticleGrid articles={saved} />;
}
