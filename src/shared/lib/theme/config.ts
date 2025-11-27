import { Flower2, Monitor, Moon, Sun, Sunset } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ThemeId = "light" | "sunset" | "dark" | "rose-pine" | "system";

export type LogoVariant = "light" | "dark";

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
  logoVariant: LogoVariant;
}

export const themeConfigs: Record<Exclude<ThemeId, "system">, ThemeConfig> = {
  light: {
    id: "light",
    label: "Light",
    icon: Sun,
    logoVariant: "light",
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    icon: Sunset,
    logoVariant: "light",
  },
  dark: {
    id: "dark",
    label: "Dark",
    icon: Moon,
    logoVariant: "dark",
  },
  "rose-pine": {
    id: "rose-pine",
    label: "Rose Pine",
    icon: Flower2,
    logoVariant: "dark",
  },
};

export const systemThemeConfig: ThemeConfig = {
  id: "system",
  label: "System",
  icon: Monitor,
  logoVariant: "light",
};

export const themeList: ThemeConfig[] = [
  themeConfigs.light,
  themeConfigs.sunset,
  themeConfigs.dark,
  themeConfigs["rose-pine"],
  systemThemeConfig,
];

export function getLogoSrc(logoVariant: LogoVariant): string {
  return logoVariant === "dark" ? "/nova-logo-dark-mode.svg" : "/nova-logo.svg";
}

export function getThemeConfig(themeId: string | undefined): ThemeConfig {
  if (!themeId || themeId === "system") {
    return systemThemeConfig;
  }
  return themeConfigs[themeId as Exclude<ThemeId, "system">] ?? themeConfigs.light;
}
