import type { MetadataRoute } from "next";
import { categories } from "@/lib/categories";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/actualites",
    "/tendances",
    "/briefing",
    "/radar",
    "/recherche",
    "/favoris",
    "/sources",
    "/a-propos",
    ...categories.map((category) => `/categorie/${category.slug}`),
  ];
  return routes.map((route) => ({
    url: new URL(route, getSiteUrl()).toString(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
