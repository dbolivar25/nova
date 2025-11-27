"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  THEME_PREFERENCE_KEY,
  applyThemePreference,
  getStoredThemePreference,
  getTimeBasedTheme,
  parseThemePreference,
} from "@/shared/lib/theme-preferences";

const TIME_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function ThemePreferenceManager() {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const applyPreference = (value: string | null = null) => {
      const preference = value ? parseThemePreference(value) : getStoredThemePreference();

      if (!preference) {
        return;
      }

      if (preference === "time") {
        setTheme(getTimeBasedTheme());
        return;
      }

      setTheme(preference);
    };

    applyPreference();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_PREFERENCE_KEY) {
        return;
      }

      applyPreference(event.newValue);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (getStoredThemePreference() === "time") {
        applyThemePreference("time", setTheme);
      }
    };

    const intervalId = window.setInterval(() => {
      if (getStoredThemePreference() === "time") {
        setTheme(getTimeBasedTheme());
      }
    }, TIME_REFRESH_INTERVAL_MS);

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [setTheme]);

  return null;
}
