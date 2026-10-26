ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "source_name" text;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "source_url" text;

UPDATE "articles" AS article
SET "source_name" = source."name",
    "source_url" = source."website_url"
FROM "sources" AS source
WHERE article."source_id" = source."id"
  AND (article."source_name" IS NULL OR article."source_url" IS NULL);

UPDATE "articles"
SET "source_name" = split_part(regexp_replace("canonical_url", '^https?://(www\.)?', ''), '/', 1),
    "source_url" = regexp_replace("canonical_url", '^((https?://)[^/]+).*$', '\1'),
    "excerpt" = NULLIF(
      trim(regexp_replace("excerpt", '^(Article URL|Comments URL|Points|# Comments)\s*:.*$', '', 'i')),
      ''
    )
WHERE "source_id" = 'hacker-news'
  AND "source_name" = 'Hacker News';

UPDATE "articles"
SET "source_name" = split_part(regexp_replace("canonical_url", '^https?://(www\.)?', ''), '/', 1),
    "source_url" = regexp_replace("canonical_url", '^((https?://)[^/]+).*$', '\1')
WHERE "source_name" IS NULL OR "source_url" IS NULL;

ALTER TABLE "articles" ALTER COLUMN "source_name" SET NOT NULL;
ALTER TABLE "articles" ALTER COLUMN "source_url" SET NOT NULL;
