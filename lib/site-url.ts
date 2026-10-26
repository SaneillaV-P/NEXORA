export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const deployment = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  return new URL(configured || deployment || "http://localhost:3000");
}
