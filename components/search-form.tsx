import { Search } from "lucide-react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <form action="/recherche" className="search-form" role="search">
      <Search aria-hidden="true" size={19} />
      <label className="sr-only" htmlFor="search-query">Rechercher une actualité</label>
      <input
        autoComplete="off"
        defaultValue={initialQuery}
        id="search-query"
        maxLength={120}
        name="q"
        placeholder="Un sujet, une idée, un mot-clé…"
        type="search"
      />
      <button type="submit">Rechercher <span>↵</span></button>
    </form>
  );
}
