import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  query = "",
}: {
  page: number;
  totalPages: number;
  query?: string;
}) {
  if (totalPages < 2) return null;
  const url = (nextPage: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(nextPage));
    return `/actualites?${params.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="pagination">
      {page > 1 ? <Link href={url(page - 1)}><ArrowLeft size={14} /> Précédent</Link> : <span aria-disabled="true"><ArrowLeft size={14} /> Précédent</span>}
      <span className="pagination-count">Page {page} / {totalPages}</span>
      {page < totalPages ? <Link href={url(page + 1)}>Suivant <ArrowRight size={14} /></Link> : <span aria-disabled="true">Suivant <ArrowRight size={14} /></span>}
    </nav>
  );
}
