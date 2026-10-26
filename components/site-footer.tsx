import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link aria-label="NEXORA — accueil" className="footer-brand" href="/">
            <Image alt="NEXORA" height={34} src="/brand/nexora-logo-3.png" width={105} />
          </Link>
          <p>Le futur ne vous attend pas.</p>
        </div>
        <p className="footer-note">
          Une veille indépendante pour comprendre<br /> ce qui façonne demain.
        </p>
        <Link className="footer-top-link" href="#top">
          Retour en haut <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NEXORA. Indépendant par nature.</span>
        <nav aria-label="Navigation de pied de page">
          <Link href="/sources">Sources</Link>
          <Link href="/a-propos">À propos</Link>
        </nav>
      </div>
    </footer>
  );
}
