import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFeed } from "@/lib/feeds";
import { sources } from "@/lib/sources";

describe("news source ingestion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes an RSS item and rejects unsafe links", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><item><title><![CDATA[Une actualité réelle]]></title><link>https://example.com/item</link><pubDate>Mon, 26 Oct 2026 08:00:00 GMT</pubDate><description><![CDATA[<p>Un court extrait.</p>]]></description></item><item><title>URL invalide</title><link>javascript:alert(1)</link><pubDate>Mon, 26 Oct 2026 08:00:00 GMT</pubDate></item><item><title>Pas de résumé communautaire</title><link>https://example.com/community</link><pubDate>Mon, 26 Oct 2026 09:00:00 GMT</pubDate><description><![CDATA[Article URL: https://example.com/community Comments URL: https://example.com/comments Points: 104 # Comments: 56]]></description></item></channel></rss>`,
      { status: 200, headers: { "content-type": "application/rss+xml" } },
    )));

    const items = await fetchFeed(sources[1]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "Une actualité réelle",
      canonicalUrl: "https://example.com/item",
      excerpt: "Un court extrait.",
      sourceName: "OpenAI",
      feedName: "OpenAI",
    });
    expect(items[0].summary).toBeNull();
    expect(items[0].clusterId).toBeNull();
    expect(items[1].excerpt).toBeNull();
  });

  it("reports upstream HTTP failures instead of returning empty success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));
    await expect(fetchFeed(sources[1])).rejects.toThrow("HTTP 503");
  });

  it("uses official Hacker News stories and removes unrelated community posts", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("[42,43]", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 42,
        type: "story",
        title: "Tool-call accuracy improves in vLLM",
        url: "https://www.ubicloud.com/blog/vllm-tool-accuracy",
        time: 1793011200,
        score: 713,
        descendants: 91,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 43,
        type: "story",
        title: "A trip across Switzerland",
        url: "https://example.com/travel",
        time: 1793011200,
      }), { status: 200 })));

    const items = await fetchFeed(sources[0]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Tool-call accuracy improves in vLLM",
      sourceName: "ubicloud.com",
      sourceUrl: "https://www.ubicloud.com",
      feedName: "Hacker News",
      canonicalUrl: "https://www.ubicloud.com/blog/vllm-tool-accuracy",
      category: "intelligence-artificielle",
      excerpt: null,
      summary: null,
    });
    expect(items[0].id).toBe(items[0].canonicalUrl);
  });

  it("keeps valid Hacker News items when one story request fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("[42,43]", { status: 200 }))
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 43,
        type: "story",
        title: "A new Rust compiler release",
        url: "https://example.com/rust-release",
        time: 1793011200,
      }), { status: 200 })));

    const items = await fetchFeed(sources[0]);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("A new Rust compiler release");
  });
});
