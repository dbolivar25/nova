"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { BookmarkedEntry, JournalEntry } from "../types/journal";

const STORAGE_KEY = "nova-journal-bookmarks";

function getStoredBookmarks(): BookmarkedEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredBookmarks(bookmarks: BookmarkedEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error("Failed to save bookmarks to localStorage:", error);
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    setBookmarks(getStoredBookmarks());
    setIsLoaded(true);
  }, []);

  // Sync to localStorage whenever bookmarks change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      setStoredBookmarks(bookmarks);
    }
  }, [bookmarks, isLoaded]);

  const addBookmark = useCallback(
    (entry: Pick<JournalEntry, "id" | "entry_date" | "mood" | "word_count">) => {
      setBookmarks((prev) => {
        // Don't add duplicates
        if (prev.some((b) => b.id === entry.id)) {
          return prev;
        }

        const newBookmark: BookmarkedEntry = {
          id: entry.id,
          entry_date: entry.entry_date,
          mood: entry.mood,
          word_count: entry.word_count,
          bookmarkedAt: new Date().toISOString(),
        };

        return [newBookmark, ...prev];
      });

      toast.success("Entry bookmarked");
    },
    []
  );

  const removeBookmark = useCallback((entryId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== entryId));
    toast.success("Bookmark removed");
  }, []);

  const toggleBookmark = useCallback(
    (entry: Pick<JournalEntry, "id" | "entry_date" | "mood" | "word_count">) => {
      const isCurrentlyBookmarked = bookmarks.some((b) => b.id === entry.id);

      if (isCurrentlyBookmarked) {
        removeBookmark(entry.id);
      } else {
        addBookmark(entry);
      }
    },
    [bookmarks, addBookmark, removeBookmark]
  );

  const isBookmarked = useCallback(
    (entryId: string) => {
      return bookmarks.some((b) => b.id === entryId);
    },
    [bookmarks]
  );

  // Sort bookmarks by bookmarkedAt (most recent first)
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort(
      (a, b) =>
        new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
    );
  }, [bookmarks]);

  return {
    bookmarks: sortedBookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    isLoaded,
  };
}
