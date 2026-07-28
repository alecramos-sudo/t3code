/**
 * Custom theme presets for T3 Code.
 *
 * Each theme specifies a `base` ("light" | "dark") which determines the
 * inherited behavior (scrollbar styling, `.dark` class, etc.) and overrides
 * for the CSS custom properties used throughout the app.
 *
 * The JSON format is shareable — users can export/import these as JSON files.
 */

export interface CustomThemeColors {
  background: string;
  foreground: string;
  primary: string;
  card: string;
  popover: string;
  secondary: string;
  muted: string;
  accent: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  info: string;
  success: string;
  warning: string;
}

export interface CustomTheme {
  name: string;
  author: string;
  base: "light" | "dark";
  colors: CustomThemeColors;
}

export const THEME_PRESETS: readonly CustomTheme[] = [
  {
    name: "Nord",
    author: "Arctic Ice Studio",
    base: "dark",
    colors: {
      background: "#2E3440",
      foreground: "#D8DEE9",
      primary: "#88C0D0",
      card: "#3B4252",
      popover: "#3B4252",
      secondary: "#434C5E",
      muted: "#4C566A",
      accent: "#81A1C1",
      border: "#434C5E",
      input: "#4C566A",
      ring: "#88C0D0",
      destructive: "#BF616A",
      info: "#5E81AC",
      success: "#A3BE8C",
      warning: "#EBCB8B",
    },
  },
  {
    name: "Dracula",
    author: "Zeno Rocha",
    base: "dark",
    colors: {
      background: "#282A36",
      foreground: "#F8F8F2",
      primary: "#BD93F9",
      card: "#44475A",
      popover: "#44475A",
      secondary: "#44475A",
      muted: "#6272A4",
      accent: "#FF79C6",
      border: "#6272A4",
      input: "#44475A",
      ring: "#BD93F9",
      destructive: "#FF5555",
      info: "#8BE9FD",
      success: "#50FA7B",
      warning: "#F1FA8C",
    },
  },
  {
    name: "Cobalt2",
    author: "Wes Bos",
    base: "dark",
    colors: {
      background: "#193549",
      foreground: "#FFFFFF",
      primary: "#FFC600",
      card: "#122738",
      popover: "#122738",
      secondary: "#0D3A58",
      muted: "#245066",
      accent: "#80FCFF",
      border: "#245066",
      input: "#0D3A58",
      ring: "#FFC600",
      destructive: "#FF628C",
      info: "#0088FF",
      success: "#3AD900",
      warning: "#FF9D00",
    },
  },
  {
    name: "Catppuccin Mocha",
    author: "Catppuccin",
    base: "dark",
    colors: {
      background: "#1E1E2E",
      foreground: "#CDD6F4",
      primary: "#CBA6F7",
      card: "#313244",
      popover: "#313244",
      secondary: "#45475A",
      muted: "#585B70",
      accent: "#F5C2E7",
      border: "#45475A",
      input: "#45475A",
      ring: "#CBA6F7",
      destructive: "#F38BA8",
      info: "#89B4FA",
      success: "#A6E3A1",
      warning: "#F9E2AF",
    },
  },
  {
    name: "Solarized Dark",
    author: "Ethan Schoonover",
    base: "dark",
    colors: {
      background: "#002B36",
      foreground: "#839496",
      primary: "#268BD2",
      card: "#073642",
      popover: "#073642",
      secondary: "#073642",
      muted: "#586E75",
      accent: "#2AA198",
      border: "#073642",
      input: "#073642",
      ring: "#268BD2",
      destructive: "#DC322F",
      info: "#268BD2",
      success: "#859900",
      warning: "#B58900",
    },
  },
  {
    name: "Solarized Light",
    author: "Ethan Schoonover",
    base: "light",
    colors: {
      background: "#FDF6E3",
      foreground: "#657B83",
      primary: "#268BD2",
      card: "#EEE8D5",
      popover: "#EEE8D5",
      secondary: "#EEE8D5",
      muted: "#93A1A1",
      accent: "#2AA198",
      border: "#EEE8D5",
      input: "#EEE8D5",
      ring: "#268BD2",
      destructive: "#DC322F",
      info: "#268BD2",
      success: "#859900",
      warning: "#B58900",
    },
  },
  {
    name: "Rosé Pine",
    author: "Rosé Pine",
    base: "dark",
    colors: {
      background: "#191724",
      foreground: "#E0DEF4",
      primary: "#C4A7E7",
      card: "#1F1D2E",
      popover: "#1F1D2E",
      secondary: "#26233A",
      muted: "#6E6A86",
      accent: "#F6C177",
      border: "#26233A",
      input: "#26233A",
      ring: "#C4A7E7",
      destructive: "#EB6F92",
      info: "#9CCFD8",
      success: "#31748F",
      warning: "#F6C177",
    },
  },
  {
    name: "Tokyo Night",
    author: "enkia",
    base: "dark",
    colors: {
      background: "#1A1B26",
      foreground: "#A9B1D6",
      primary: "#7AA2F7",
      card: "#24283B",
      popover: "#24283B",
      secondary: "#292E42",
      muted: "#565F89",
      accent: "#BB9AF7",
      border: "#292E42",
      input: "#292E42",
      ring: "#7AA2F7",
      destructive: "#F7768E",
      info: "#7DCFFF",
      success: "#9ECE6A",
      warning: "#E0AF68",
    },
  },
];

/** CSS variable keys in the order they're defined in index.css */
const CSS_VAR_KEYS: ReadonlyArray<keyof CustomThemeColors> = [
  "background",
  "foreground",
  "primary",
  "card",
  "popover",
  "secondary",
  "muted",
  "accent",
  "border",
  "input",
  "ring",
  "destructive",
  "info",
  "success",
  "warning",
];

/**
 * Parse a hex color into [r, g, b] (0–255).
 * Supports #RGB, #RRGGBB, and #RRGGBBAA.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return [parseInt(h[0]! + h[0]!, 16), parseInt(h[1]! + h[1]!, 16), parseInt(h[2]! + h[2]!, 16)];
  }
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Relative luminance (WCAG 2.x). */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Pick black or white foreground for best contrast on `bgHex`. */
function contrastForeground(bgHex: string): string {
  const [r, g, b] = hexToRgb(bgHex);
  return luminance(r, g, b) > 0.4 ? "#000000" : "#ffffff";
}

/** Mix a color toward white or black to produce a muted text variant. */
function mutedForeground(base: "light" | "dark", fg: string): string {
  const [r, g, b] = hexToRgb(fg);
  const factor = base === "dark" ? 0.55 : 0.5;
  const mix = (c: number) => Math.round(c * factor + (base === "dark" ? 128 : 80) * (1 - factor));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function getRootElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.documentElement ?? null;
}

function getRootStyle(): CSSStyleDeclaration | null {
  return getRootElement()?.style ?? null;
}

/** Inject a custom theme's colors as CSS variables on :root */
export function applyCustomThemeColors(
  colors: CustomThemeColors,
  base: "light" | "dark" = "dark",
): void {
  const root = getRootStyle();
  if (!root) return;
  getRootElement()?.setAttribute("data-custom-theme-active", "true");
  for (const key of CSS_VAR_KEYS) {
    root.setProperty(`--${key}`, colors[key]);
    root.setProperty(`--custom-theme-${key}`, colors[key]);
    if (key === "card" || key === "popover") {
      root.setProperty(`--${key}-foreground`, colors.foreground);
    }
  }
  const primaryForeground = contrastForeground(colors.primary);
  const secondaryForeground = contrastForeground(colors.secondary);
  const mutedText = mutedForeground(base, colors.foreground);
  const accentForeground = contrastForeground(colors.accent);
  root.setProperty("--primary-foreground", primaryForeground);
  root.setProperty("--secondary-foreground", secondaryForeground);
  root.setProperty("--muted-foreground", mutedText);
  root.setProperty("--accent-foreground", accentForeground);
  root.setProperty("--destructive-foreground", contrastForeground(colors.destructive));
  root.setProperty("--info-foreground", contrastForeground(colors.info));
  root.setProperty("--success-foreground", contrastForeground(colors.success));
  root.setProperty("--warning-foreground", contrastForeground(colors.warning));
  root.setProperty("--app-chrome-background", colors.background);
  root.setProperty("--custom-theme-primary-foreground", primaryForeground);
  root.setProperty("--custom-theme-secondary-foreground", secondaryForeground);
  root.setProperty("--custom-theme-muted-foreground", mutedText);
  root.setProperty("--custom-theme-accent-foreground", accentForeground);
  root.setProperty("--sidebar", colors.card);
  root.setProperty("--sidebar-foreground", colors.foreground);
  root.setProperty("--sidebar-muted-foreground", mutedText);
  root.setProperty("--sidebar-control-surface", colors.secondary);
  root.setProperty("--sidebar-row-hover", colors.secondary);
  root.setProperty("--sidebar-row-active", colors.muted);
  root.setProperty("--sidebar-row-selected", colors.secondary);
  root.setProperty("--sidebar-border", colors.border);
  root.setProperty("--sidebar-stage-fade", colors.card);
  root.setProperty("--custom-theme-sidebar", colors.card);
  root.setProperty("--custom-theme-sidebar-foreground", colors.foreground);
  root.setProperty("--custom-theme-sidebar-muted-foreground", mutedText);
  root.setProperty("--custom-theme-sidebar-control-surface", colors.secondary);
  root.setProperty("--custom-theme-sidebar-row-hover", colors.secondary);
  root.setProperty("--custom-theme-sidebar-row-active", colors.muted);
  root.setProperty("--custom-theme-sidebar-row-selected", colors.secondary);
  root.setProperty("--custom-theme-sidebar-border", colors.border);
  root.setProperty("--custom-theme-sidebar-stage-fade", colors.card);
}

/** Remove all custom theme CSS variable overrides from :root */
export function clearCustomThemeColors(): void {
  const root = getRootStyle();
  if (!root) return;
  getRootElement()?.removeAttribute("data-custom-theme-active");
  for (const key of CSS_VAR_KEYS) {
    root.removeProperty(`--${key}`);
    root.removeProperty(`--custom-theme-${key}`);
    if (key === "card" || key === "popover") {
      root.removeProperty(`--${key}-foreground`);
    }
  }
  root.removeProperty("--primary-foreground");
  root.removeProperty("--secondary-foreground");
  root.removeProperty("--muted-foreground");
  root.removeProperty("--accent-foreground");
  root.removeProperty("--destructive-foreground");
  root.removeProperty("--info-foreground");
  root.removeProperty("--success-foreground");
  root.removeProperty("--warning-foreground");
  root.removeProperty("--app-chrome-background");
  root.removeProperty("--custom-theme-primary-foreground");
  root.removeProperty("--custom-theme-secondary-foreground");
  root.removeProperty("--custom-theme-muted-foreground");
  root.removeProperty("--custom-theme-accent-foreground");
  root.removeProperty("--sidebar");
  root.removeProperty("--sidebar-foreground");
  root.removeProperty("--sidebar-muted-foreground");
  root.removeProperty("--sidebar-control-surface");
  root.removeProperty("--sidebar-row-hover");
  root.removeProperty("--sidebar-row-active");
  root.removeProperty("--sidebar-row-selected");
  root.removeProperty("--sidebar-border");
  root.removeProperty("--sidebar-stage-fade");
  root.removeProperty("--custom-theme-sidebar");
  root.removeProperty("--custom-theme-sidebar-foreground");
  root.removeProperty("--custom-theme-sidebar-muted-foreground");
  root.removeProperty("--custom-theme-sidebar-control-surface");
  root.removeProperty("--custom-theme-sidebar-row-hover");
  root.removeProperty("--custom-theme-sidebar-row-active");
  root.removeProperty("--custom-theme-sidebar-row-selected");
  root.removeProperty("--custom-theme-sidebar-border");
  root.removeProperty("--custom-theme-sidebar-stage-fade");
}

const CUSTOM_THEMES_STORAGE_KEY = "t3code:custom-themes";
const ACTIVE_CUSTOM_THEME_KEY = "t3code:custom-theme-name";

function getThemeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadUserThemes(): CustomTheme[] {
  try {
    const raw = getThemeStorage()?.getItem(CUSTOM_THEMES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomTheme[]) : [];
  } catch {
    return [];
  }
}

export function saveUserThemes(themes: CustomTheme[]): void {
  getThemeStorage()?.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
}

export function getActiveCustomThemeName(): string | null {
  try {
    return getThemeStorage()?.getItem(ACTIVE_CUSTOM_THEME_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setActiveCustomThemeName(name: string | null): void {
  const storage = getThemeStorage();
  if (!storage) return;
  if (name) {
    storage.setItem(ACTIVE_CUSTOM_THEME_KEY, name);
  } else {
    storage.removeItem(ACTIVE_CUSTOM_THEME_KEY);
  }
}
