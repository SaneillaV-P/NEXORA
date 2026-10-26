import { FavoritesList } from "@/components/favorites-list";
import { getArticles } from "@/lib/news";

export const metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const articles = await getArticles();
  return (
    <div className="page-wrap inner-page">
      <div className="page-topline">VOTRE SÉLECTION PERSONNELLE</div>
      <header className="page-intro">
        <p className="eyebrow">À RELIRE QUAND VOUS VOULEZ</p>
        <h1>Mes favoris<span className="title-period">.</span></h1>
        <p>Vos articles enregistrés restent dans ce navigateur.</p>
      </header>
      <FavoritesList articles={articles} />
    </div>
  );
}
