// Theme registry for condo-net
// Ported from Condo-backdmin — source of truth for all condominium themes

import twitterTheme from "./twitter.json";
import amberMinimalTheme from "./amber-minimal.json";
import violetBloomTheme from "./violet-bloom.json";
import northernLightsTheme from "./northern-lights.json";
import candylandTheme from "./candyland.json";
import oceanBreezeTheme from "./ocean-breeze.json";
import graphiteTheme from "./graphite.json";
import cyberpunkTheme from "./cyberpunk.json";
import cyberpunk2077Theme from "./cyberpunk-2077.json";
import facebookTheme from "./facebook.json";

export interface ThemeCssVars {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface Theme {
  id: string;
  name: string;
  preview: string;
  cssVars: ThemeCssVars;
}

export const themes: Theme[] = [
  {
    id: "twitter",
    name: "Twitter",
    preview: "#1D9BF0",
    cssVars: twitterTheme.cssVars as ThemeCssVars,
  },
  {
    id: "amber-minimal",
    name: "Amber Minimal",
    preview: "#C48023",
    cssVars: amberMinimalTheme.cssVars as ThemeCssVars,
  },
  {
    id: "violet-bloom",
    name: "Violet Bloom",
    preview: "#8B5CF6",
    cssVars: violetBloomTheme.cssVars as ThemeCssVars,
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    preview: "#45B8A0",
    cssVars: northernLightsTheme.cssVars as ThemeCssVars,
  },
  {
    id: "candyland",
    name: "Candyland",
    preview: "#E85D75",
    cssVars: candylandTheme.cssVars as ThemeCssVars,
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    preview: "#2D8B9F",
    cssVars: oceanBreezeTheme.cssVars as ThemeCssVars,
  },
  {
    id: "graphite",
    name: "Graphite",
    preview: "#666666",
    cssVars: graphiteTheme.cssVars as ThemeCssVars,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    preview: "#CC33CC",
    cssVars: cyberpunkTheme.cssVars as ThemeCssVars,
  },
  {
    id: "cyberpunk-2077",
    name: "Cyberpunk 2077",
    preview: "#EB9605",
    cssVars: cyberpunk2077Theme.cssVars as ThemeCssVars,
  },
  {
    id: "facebook",
    name: "Facebook",
    preview: "#0866FF",
    cssVars: facebookTheme.cssVars as ThemeCssVars,
  },
];

/** Default fallback theme when theme_id is missing or invalid */
export const DEFAULT_THEME_ID = "twitter";

/** Lookup map for O(1) access */
const themeMap = new Map(themes.map((t) => [t.id, t]));

export function getThemeById(id: string): Theme | undefined {
  return themeMap.get(id);
}

export function getDefaultTheme(): Theme {
  return themeMap.get(DEFAULT_THEME_ID)!;
}

export function isValidTheme(id: string | null | undefined): id is string {
  return typeof id === "string" && themeMap.has(id);
}
