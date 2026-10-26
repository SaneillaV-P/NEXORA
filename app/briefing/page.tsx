import { desc, eq, inArray } from "drizzle-orm";
import { AudioLines, Sparkles } from "lucide-react";
import Link from "next/link";
import { getAiStatus } from "@/lib/ai-provider";
import { db } from "@/lib/db";
import { articles, briefings, sources } from "@/lib/db/schema";

export const metadata = { title: "Briefing IA" };

export default async function BriefingPage() {
  const aiStatus = getAiStatus();
  const latest = db
    ? (await db.select().from(briefings).orderBy(desc(briefings.createdAt)).limit(1))[0]
    : undefined;
  const references = db && latest?.articleIds.length
    ? await db
      .select({
        slug: articles.slug,
        title: articles.title,
        sourceName: articles.sourceName,
        feedName: sources.name,
      })
      .from(articles)
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(inArray(articles.id, latest.articleIds))
    : [];
  return (
    <div className="page-wrap inner-page">
      <div className="page-topline"><Sparkles size={13} /> SYNTHÈSE AUTOMATISÉE, SOURCES À L’APPUI</div>
      <header className="page-intro">
        <p className="eyebrow">LE BRIEFING NEXORA</p>
        <h1>Le signal,<br /><span className="title-soft">pas le bruit.</span></h1>
        <p>Un résumé périodique des actualités collectées. Chaque élément renvoie à son origine.</p>
      </header>
      {latest ? (
        <article className="briefing-reading">
          <div className="briefing-reading-meta"><AudioLines size={16} /> DERNIER BRIEFING · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(latest.createdAt)}</div>
          <h2>{latest.title}</h2>
          <div className="briefing-body">{latest.body.split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          <div className="briefing-references">
            <p className="eyebrow">ARTICLES CITÉS</p>
            {references.map((reference) => (
              <Link href={`/article/${reference.slug}`} key={reference.slug}>
                {reference.title}<span>{reference.sourceName}</span>
              </Link>
            ))}
          </div>
          <p className="source-disclaimer">{latest.articleIds.length} article{latest.articleIds.length !== 1 ? "s" : ""} source{latest.articleIds.length !== 1 ? "s" : ""} intégré{latest.articleIds.length !== 1 ? "s" : ""} à ce briefing.</p>
        </article>
      ) : (
        <section className="briefing-unavailable">
          <div className="briefing-icon"><AudioLines size={22} /></div>
          <div>
            <p className="eyebrow">BRIEFING NON DISPONIBLE</p>
            <h2>Le briefing n’a pas encore été généré.</h2>
            <p>Il sera créé lors d’une collecte planifiée lorsque PostgreSQL et un fournisseur IA configuré seront disponibles. Aucune synthèse fictive n’est affichée.</p>
            <div className="config-checks">
              <span>{db ? "○ PostgreSQL configuré, briefing à générer" : "○ PostgreSQL à configurer"}</span>
              <span className={aiStatus.configured ? "configured" : ""}>
                {aiStatus.configured ? "✓" : "○"} IA : {aiStatus.provider}
                {aiStatus.configured ? " configuré" : aiStatus.keyVariable ? ` — renseigner ${aiStatus.keyVariable}` : " — fournisseur désactivé"}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
