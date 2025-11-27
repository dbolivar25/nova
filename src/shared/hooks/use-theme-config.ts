"use client";

import { useTheme } from "next-themes";
import {
  getLogoSrc,
  getThemeConfig,
  themeConfigs,
  type ThemeId,
} from "@/shared/lib/theme/config";

export function useThemeConfig() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentConfig = getThemeConfig(resolvedTheme);
  const logoSrc = getLogoSrc(currentConfig.logoVariant);

  return {
    theme: theme as ThemeId | undefined,
    setTheme: setTheme as (theme: ThemeId) => void,
    resolvedTheme: resolvedTheme as Exclude<ThemeId, "system"> | undefined,
    config: currentConfig,
    logoSrc,
    configs: themeConfigs,
  };
}

export type UseThemeConfigReturn = ReturnType<typeof useThemeConfig>;
