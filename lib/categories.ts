export const categories = [
  { slug: "intelligence-artificielle", name: "Intelligence artificielle", short: "IA", color: "lavender" },
  { slug: "developpement", name: "Développement", short: "Dev", color: "blue" },
  { slug: "cybersecurite", name: "Cybersécurité", short: "Cyber", color: "rose" },
  { slug: "cloud-devops", name: "Cloud & DevOps", short: "Cloud", color: "green" },
  { slug: "hardware", name: "Hardware", short: "Hardware", color: "amber" },
  { slug: "open-source", name: "Open source", short: "Open source", color: "cyan" },
  { slug: "entreprises", name: "Entreprises", short: "Économie", color: "violet" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export function getCategoryName(slug: string): string {
  return categories.find((category) => category.slug === slug)?.name ?? "Technologie";
}
