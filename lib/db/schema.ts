import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const sources = pgTable(
  "sources",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    feedUrl: text("feed_url").notNull(),
    websiteUrl: text("website_url").notNull(),
    categorySlug: text("category_slug").references(() => categories.slug),
    enabled: boolean("enabled").notNull().default(true),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("sources_feed_url_unique").on(table.feedUrl)],
);

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    excerpt: text("excerpt"),
    canonicalUrl: text("canonical_url").notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug),
    tags: text("tags").array().notNull().default([]),
    entities: text("entities").array().notNull().default([]),
    clusterId: text("cluster_id"),
    aiProcessedAt: timestamp("ai_processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_canonical_url_unique").on(table.canonicalUrl),
    uniqueIndex("articles_slug_unique").on(table.slug),
    index("articles_published_at_idx").on(table.publishedAt),
    index("articles_category_published_idx").on(table.categorySlug, table.publishedAt),
    index("articles_source_published_idx").on(table.sourceId, table.publishedAt),
  ],
);

export const trends = pgTable(
  "trends",
  {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    slug: text("slug").notNull(),
    mentionCount: integer("mention_count").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    windowEndedAt: timestamp("window_ended_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("trends_window_idx").on(table.windowEndedAt)],
);

export const briefings = pgTable("briefings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  articleIds: text("article_ids").array().notNull().default([]),
  periodStartedAt: timestamp("period_started_at", { withTimezone: true }).notNull(),
  periodEndedAt: timestamp("period_ended_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const processingLogs = pgTable(
  "processing_logs",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id").references(() => sources.id),
    status: text("status").notNull(),
    message: text("message").notNull(),
    itemCount: integer("item_count").notNull().default(0),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("processing_logs_created_idx").on(table.createdAt)],
);
