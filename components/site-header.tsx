import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu, Search } from "lucide-react";

const navigation = [
  { href: "/actualites", label: "Actualités" },
  { href: "/tendances", label: "Tendances" },
  { href: "/briefing", label: "Briefing IA" },
  { href: "/radar", label: "Radar" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label="NEXORA — accueil" className="brand" href="/">
          <Image
            alt="NEXORA"
            className="brand-logo"
            height={42}
            priority
            src="/brand/nexora-logo-3.png"
            width={116}
          />
          <span className="brand-divider" />
          <span className="brand-edition">LA VEILLE, AUTREMENT</span>
        </Link>
        <nav aria-label="Navigation principale" className="main-nav">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link aria-label="Rechercher" className="icon-button" href="/recherche">
            <Search size={17} strokeWidth={1.8} />
          </Link>
          <Link className="header-favorites" href="/favoris">
            Mes favoris
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Ouvrir le menu">
              <Menu size={21} />
            </summary>
            <nav aria-label="Navigation mobile" className="mobile-menu-panel">
              {[...navigation, { href: "/favoris", label: "Mes favoris" }, { href: "/sources", label: "Les sources" }].map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/recherche">
                Recherche <ArrowUpRight size={14} />
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
