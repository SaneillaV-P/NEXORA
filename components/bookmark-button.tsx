"use client";

import { useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

const STORAGE_KEY = "nexora:favorites";

function subscribeFavorites(callback: () => void): () => void {
  window.addEventListener("nexora:favorites-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("nexora:favorites-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
  } catch {
    return [];
  }
}

export function BookmarkButton({ articleId }: { articleId: string }) {
  const saved = useSyncExternalStore(
    subscribeFavorites,
    () => readFavorites().includes(articleId),
    () => false,
  );

  function toggle() {
    const favorites = readFavorites();
    const updated = favorites.includes(articleId)
      ? favorites.filter((id) => id !== articleId)
      : [...favorites, articleId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("nexora:favorites-changed"));
  }

  return (
    <button
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={saved}
      className={`bookmark-button${saved ? " is-saved" : ""}`}
      onClick={toggle}
      type="button"
    >
      <Bookmark fill={saved ? "currentColor" : "none"} size={16} strokeWidth={1.8} />
    </button>
  );
}
