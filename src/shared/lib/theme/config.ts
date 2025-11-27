import { Cloud, Flower2, Monitor, Moon, Sun, Sunset, TreePine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ThemeId = "light" | "sunset" | "dark" | "rose-pine" | "evergreen" | "sky" | "system";

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
}

const themeConfigs: Record<Exclude<ThemeId, "system">, ThemeConfig> = {
  light: {
    id: "light",
    label: "Light",
    icon: Sun,
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    icon: Sunset,
  },
  dark: {
    id: "dark",
    label: "Dark",
    icon: Moon,
  },
  "rose-pine": {
    id: "rose-pine",
    label: "Rose Pine",
    icon: Flower2,
  },
  evergreen: {
    id: "evergreen",
    label: "Evergreen",
    icon: TreePine,
  },
  sky: {
    id: "sky",
    label: "Sky",
    icon: Cloud,
  },
};

const systemThemeConfig: ThemeConfig = {
  id: "system",
  label: "System",
  icon: Monitor,
};

export const themeList: ThemeConfig[] = [
  themeConfigs.light,
  themeConfigs.sunset,
  themeConfigs.dark,
  themeConfigs["rose-pine"],
  themeConfigs.evergreen,
  themeConfigs.sky,
  systemThemeConfig,
];
