import Link from "next/link";
import { ArrowRight, Compass, Eye, Fingerprint } from "lucide-react";

export const metadata = { title: "À propos" };

const principles = [
  { icon: Compass, title: "Curiosité", text: "Explorer les idées qui déplacent les lignes, au-delà des annonces qui font du bruit." },
  { icon: Eye, title: "Transparence", text: "Chaque information garde sa source, sa date de publication et son lien d’origine." },
  { icon: Fingerprint, title: "Indépendance", text: "NEXORA est un média de veille. Les outils d’IA aident à lire, ils ne remplacent pas le jugement éditorial." },
];

export default function AboutPage() {
  return (
    <div className="page-wrap inner-page about-page">
      <div className="page-topline">NEXORA · MÉDIA INDÉPENDANT</div>
      <header className="page-intro">
        <p className="eyebrow">LE MONDE CHANGE. REGARDONS-LE EN FACE.</p>
        <h1>Le futur ne<br /><span className="title-soft">vous attend pas.</span></h1>
        <p>NEXORA est un média indépendant de veille technologique. Notre ambition : rendre lisible le mouvement, sans le ralentir.</p>
      </header>
      <div className="principles-grid">
        {principles.map(({ icon: Icon, title, text }, index) => (
          <article className="principle-card" key={title}>
            <span className="principle-index">0{index + 1}</span><Icon size={19} strokeWidth={1.5} />
            <h2>{title}</h2><p>{text}</p>
          </article>
        ))}
      </div>
      <section className="about-method">
        <p className="eyebrow">COMMENT ÇA FONCTIONNE</p>
        <h2>Des sources ouvertes.<br />Un regard augmenté.</h2>
        <p>Des flux RSS et Atom publics sont collectés et normalisés. Lorsque le service est configuré, l’IA peut proposer une classification et une synthèse en français à partir des seuls extraits fournis. Les articles complets restent chez leurs éditeurs.</p>
        <Link className="text-link" href="/sources">Voir les sources suivies <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}
