export type ThemePreference = "light" | "sunset" | "dark" | "system" | "time";

export const THEME_PREFERENCE_KEY = "nova-theme-preference";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "light";

const isThemePreference = (value: string | null): value is ThemePreference => {
  return value === "light" || value === "sunset" || value === "dark" || value === "system" || value === "time";
};

export const parseThemePreference = (value: string | null): ThemePreference | null => {
  if (!value) {
    return null;
  }

  return isThemePreference(value) ? value : null;
};

export const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PREFERENCE;
  }

  const stored = parseThemePreference(localStorage.getItem(THEME_PREFERENCE_KEY));

  if (!stored) {
    return DEFAULT_THEME_PREFERENCE;
  }

  return stored;
};

export const setStoredThemePreference = (preference: ThemePreference) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(THEME_PREFERENCE_KEY, preference);
};

export const getTimeBasedTheme = (now = new Date()): Exclude<ThemePreference, "system" | "time"> => {
  const hour = now.getHours();

  if (hour >= 6 && hour < 9) {
    return "sunset";
  }

  if (hour >= 9 && hour < 17) {
    return "light";
  }

  if (hour >= 17 && hour < 21) {
    return "sunset";
  }

  return "dark";
};

export const applyThemePreference = (preference: ThemePreference, setTheme: (theme: string) => void) => {
  setStoredThemePreference(preference);

  if (preference === "time") {
    setTheme(getTimeBasedTheme());
    return;
  }

  setTheme(preference);
};
