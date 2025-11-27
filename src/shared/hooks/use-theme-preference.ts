"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

import {
  DEFAULT_THEME_PREFERENCE,
  ThemePreference,
  applyThemePreference,
  getStoredThemePreference,
} from "@/shared/lib/theme-preferences";

export const useThemePreference = () => {
  const { theme, setTheme } = useTheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => getStoredThemePreference() || DEFAULT_THEME_PREFERENCE,
  );

  useEffect(() => {
    const storedPreference = getStoredThemePreference();
    setPreferenceState(storedPreference);
    applyThemePreference(storedPreference, setTheme);
  }, [setTheme]);

  useEffect(() => {
    setPreferenceState(getStoredThemePreference());
  }, [theme]);

  const handlePreferenceChange = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      applyThemePreference(next, setTheme);
    },
    [setTheme],
  );

  return { preference, setPreference: handlePreferenceChange };
};
