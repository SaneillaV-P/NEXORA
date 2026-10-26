import Link from "next/link";
import { ArrowUpRight, Rss } from "lucide-react";
import { sources } from "@/lib/sources";

export const metadata = { title: "Sources" };

export default function SourcesPage() {
  return (
    <div className="page-wrap inner-page">
      <div className="page-topline"><Rss size={13} /> TRAÇABILITÉ AVANT TOUT</div>
      <header className="page-intro">
        <p className="eyebrow">NOS SOURCES</p>
        <h1>À la source<span className="title-period">.</span></h1>
        <p>Les flux suivis par NEXORA. Les articles conservent toujours leur provenance et leur lien original.</p>
      </header>
      <div className="sources-list">
        {sources.map((source, index) => (
          <article className="source-row" key={source.id}>
            <span className="source-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="source-description"><h2>{source.name}</h2><p>{source.description}</p></div>
            <span className="source-category">{source.category.replaceAll("-", " ")}</span>
            <Link aria-label={`Visiter ${source.name}`} href={source.websiteUrl} rel="noreferrer" target="_blank"><ArrowUpRight size={16} /></Link>
          </article>
        ))}
      </div>
      <p className="sources-footnote">Les flux sont interrogés lors de la collecte planifiée. La disponibilité peut varier selon les éditeurs. NEXORA stocke les métadonnées et de courts extraits, pas les articles complets.</p>
    </div>
  );
}
