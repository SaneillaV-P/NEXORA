CREATE TABLE IF NOT EXISTS "categories" (
  "slug" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "sources" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "feed_url" text NOT NULL,
  "website_url" text NOT NULL,
  "category_slug" text REFERENCES "categories"("slug"),
  "enabled" boolean NOT NULL DEFAULT true,
  "last_fetched_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "sources_feed_url_unique" ON "sources" ("feed_url");

CREATE TABLE IF NOT EXISTS "articles" (
  "id" text PRIMARY KEY,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "excerpt" text,
  "canonical_url" text NOT NULL,
  "source_name" text NOT NULL,
  "source_url" text NOT NULL,
  "published_at" timestamptz NOT NULL,
  "source_id" text NOT NULL REFERENCES "sources"("id"),
  "category_slug" text NOT NULL REFERENCES "categories"("slug"),
  "tags" text[] NOT NULL DEFAULT '{}',
  "entities" text[] NOT NULL DEFAULT '{}',
  "cluster_id" text,
  "ai_processed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "articles_canonical_url_unique" ON "articles" ("canonical_url");
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_unique" ON "articles" ("slug");
CREATE INDEX IF NOT EXISTS "articles_published_at_idx" ON "articles" ("published_at");
CREATE INDEX IF NOT EXISTS "articles_category_published_idx" ON "articles" ("category_slug", "published_at");
CREATE INDEX IF NOT EXISTS "articles_source_published_idx" ON "articles" ("source_id", "published_at");

CREATE TABLE IF NOT EXISTS "trends" (
  "id" text PRIMARY KEY,
  "topic" text NOT NULL,
  "slug" text NOT NULL,
  "mention_count" integer NOT NULL DEFAULT 0,
  "window_started_at" timestamptz NOT NULL,
  "window_ended_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "trends_window_idx" ON "trends" ("window_ended_at");

CREATE TABLE IF NOT EXISTS "briefings" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "article_ids" text[] NOT NULL DEFAULT '{}',
  "period_started_at" timestamptz NOT NULL,
  "period_ended_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "processing_logs" (
  "id" text PRIMARY KEY,
  "source_id" text REFERENCES "sources"("id"),
  "status" text NOT NULL,
  "message" text NOT NULL,
  "item_count" integer NOT NULL DEFAULT 0,
  "duration_ms" integer,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "processing_logs_created_idx" ON "processing_logs" ("created_at");

INSERT INTO "categories" ("slug", "name", "description") VALUES
  ('intelligence-artificielle', 'Intelligence artificielle', 'Modèles, recherches et usages de l’IA.'),
  ('developpement', 'Développement', 'Logiciels, langages et pratiques de développement.'),
  ('cybersecurite', 'Cybersécurité', 'Sécurité informatique et vie privée.'),
  ('cloud-devops', 'Cloud & DevOps', 'Infrastructure, cloud et opérations.'),
  ('hardware', 'Hardware', 'Composants et matériel informatique.'),
  ('open-source', 'Open source', 'Logiciels et communautés open source.'),
  ('entreprises', 'Entreprises', 'Économie et acteurs de la tech.')
ON CONFLICT ("slug") DO NOTHING;
