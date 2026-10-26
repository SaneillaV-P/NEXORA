import type { FeedSource } from "@/lib/types";

export const sources: FeedSource[] = [
  {
    id: "hacker-news",
    name: "Hacker News",
    provider: "hacker-news",
    feedUrl: "https://hacker-news.firebaseio.com/v0/topstories.json",
    websiteUrl: "https://news.ycombinator.com/",
    category: "developpement",
    description: "L’API officielle signale des histoires technologiques et renvoie à leur éditeur d’origine.",
  },
  {
    id: "openai",
    name: "OpenAI",
    provider: "rss",
    feedUrl: "https://openai.com/news/rss.xml",
    websiteUrl: "https://openai.com/news/",
    category: "intelligence-artificielle",
    description: "Annonces et recherches publiées par OpenAI.",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    provider: "rss",
    feedUrl: "https://github.blog/feed/",
    websiteUrl: "https://github.blog/",
    category: "open-source",
    description: "Actualités de la plateforme, de l’open source et des outils pour développeurs.",
  },
  {
    id: "google-security",
    name: "Google Security Blog",
    provider: "rss",
    feedUrl: "https://security.googleblog.com/feeds/posts/default",
    websiteUrl: "https://security.googleblog.com/",
    category: "cybersecurite",
    description: "Analyses et annonces de sécurité publiées par les équipes Google.",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Blog",
    provider: "rss",
    feedUrl: "https://blog.cloudflare.com/rss/",
    websiteUrl: "https://blog.cloudflare.com/",
    category: "cloud-devops",
    description: "Ingénierie, infrastructure, sécurité et réseau.",
  },
];
