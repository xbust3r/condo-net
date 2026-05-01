/**
 * Theme Runtime — applies CSS custom properties for condominium themes.
 *
 * Strategy: inject CSS variables directly onto :root / .dark.
 * No dependency on next-themes; full control for multi-tenant brand theming.
 */
import {
  type Theme,
  getThemeById,
  getDefaultTheme,
  isValidTheme,
  DEFAULT_THEME_ID,
} from "@/themes";

const ROOT_SELECTOR = ":root";
const DARK_SELECTOR = ".dark";

/** Currently active theme id */
let activeThemeId: string | null = null;

/** Returns the id of the currently active theme (null if none applied) */
export function getActiveThemeId(): string | null {
  return activeThemeId;
}

/**
 * Apply a theme by injecting its CSS variables into the document.
 * Handles both light and dark variants via :root and .dark selectors.
 *
 * @param themeId - The theme id to apply. Uses DEFAULT_THEME_ID as fallback.
 */
export function applyTheme(themeId: string | null | undefined): void {
  const theme: Theme = isValidTheme(themeId)
    ? getThemeById(themeId)!
    : getDefaultTheme();

  if (!isValidTheme(themeId)) {
    console.warn(
      `[theme-runtime] theme_id "${themeId}" is invalid — falling back to "${DEFAULT_THEME_ID}"`
    );
  }

  const style = document.documentElement.style;

  // Inject light theme variables
  const light = theme.cssVars.light;
  for (const [key, value] of Object.entries(light)) {
    style.setProperty(`--${key}`, value);
  }

  // Store dark theme variables for later use (handled by .dark class)
  // We apply them to a CSS stylesheet or handle via class toggle
  applyDarkVars(theme);

  activeThemeId = theme.id;
  document.documentElement.setAttribute("data-theme", theme.id);
}

/**
 * Apply dark-mode CSS variables via a dedicated <style> element.
 * This avoids polluting :root when in light mode.
 */
function applyDarkVars(theme: Theme): void {
  const dark = theme.cssVars.dark;
  const vars = Object.entries(dark)
    .map(([key, value]) => `--${key}: ${value};`)
    .join("\n    ");

  const sheetId = "condo-theme-dark";
  let styleEl = document.getElementById(sheetId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = sheetId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `.dark {\n    ${vars}\n  }`;
}

/**
 * Reset to the default theme and remove all injected variables.
 */
export function resetTheme(): void {
  // Remove the dark style element
  const sheetId = "condo-theme-dark";
  const styleEl = document.getElementById(sheetId);
  if (styleEl) {
    styleEl.remove();
  }

  // Re-apply default theme
  applyTheme(DEFAULT_THEME_ID);
  activeThemeId = null;
}

/**
 * Restore theme from a stored theme_id (e.g. from localStorage on page reload).
 * Safe to call before the DOM is fully ready — uses requestAnimationFrame.
 */
export function restoreTheme(themeId: string | null | undefined): void {
  if (typeof window === "undefined") return;

  if (document.readyState === "loading") {
    // Defer until DOM is ready to avoid flash
    requestAnimationFrame(() => applyTheme(themeId));
  } else {
    applyTheme(themeId);
  }
}
