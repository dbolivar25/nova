"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import {
  DEFAULT_THEME_PREFERENCE,
  ThemePreference,
  applyThemePreference,
  getStoredThemePreference,
} from "@/shared/lib/theme-preferences";

type ThemePreferenceStore = {
  preference: ThemePreference;
};

const store: ThemePreferenceStore = {
  preference: DEFAULT_THEME_PREFERENCE,
};

if (typeof window !== "undefined") {
  store.preference = getStoredThemePreference();
}

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => store.preference;

const setPreferenceState = (preference: ThemePreference) => {
  if (store.preference === preference) {
    return;
  }

  store.preference = preference;
  listeners.forEach((listener) => listener());
};

export const useThemePreference = () => {
  const { setTheme } = useTheme();
  const preference = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    applyThemePreference(preference, setTheme);
  }, [preference, setTheme]);

  const handlePreferenceChange = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  return { preference, setPreference: handlePreferenceChange };
};
