import { describe, expect, it } from "vitest";
import { hostnameForUrl, safeHttpUrl, stripMarkup, toSlug } from "@/lib/utils";

describe("NEXORA utilities", () => {
  it("creates stable, accent-insensitive French slugs", () => {
    expect(toSlug("L’IA — déjà là !")).toBe("l-ia-deja-la");
  });

  it("removes HTML while preserving readable text", () => {
    expect(stripMarkup("<p>Un <strong>signal</strong> &amp; une idée</p>")).toBe("Un signal & une idée");
    expect(stripMarkup("<script>alert(1)</script>")).toBeNull();
  });

  it("accepts only HTTP(S) source links", () => {
    expect(safeHttpUrl("https://example.com/news")).toBe("https://example.com/news");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
  });

  it("identifies the original publisher from its canonical URL", () => {
    expect(hostnameForUrl("https://www.example.com/news")).toBe("example.com");
    expect(hostnameForUrl("invalid")).toBeNull();
  });
});
