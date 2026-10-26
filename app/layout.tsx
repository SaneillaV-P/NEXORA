import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "NEXORA — Le futur ne vous attend pas.",
    template: "%s — NEXORA",
  },
  description:
    "NEXORA, média indépendant de veille technologique. L’essentiel de l’actualité tech, sourcé et éclairé.",
  openGraph: {
    title: "NEXORA — Le futur ne vous attend pas.",
    description: "Une veille technologique indépendante, sourcée et augmentée.",
    siteName: "NEXORA",
    locale: "fr_FR",
    type: "website",
  },
  icons: { icon: "/brand/nexora-logo.png" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body id="top">
        <a className="skip-link" href="#contenu">Aller au contenu</a>
        <SiteHeader />
        <main id="contenu">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
