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

/** Inject a custom theme's colors as CSS variables on :root */
export function applyCustomThemeColors(colors: CustomThemeColors): void {
  const root = document.documentElement;
  for (const key of CSS_VAR_KEYS) {
    root.style.setProperty(`--${key}`, colors[key]);
    // Also set card-foreground, popover-foreground, etc. to match foreground
    if (key === "card" || key === "popover") {
      root.style.setProperty(`--${key}-foreground`, colors.foreground);
    }
  }
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty("--secondary-foreground", colors.foreground);
  root.style.setProperty("--muted-foreground", colors.muted);
  root.style.setProperty("--accent-foreground", colors.foreground);
  root.style.setProperty("--destructive-foreground", colors.destructive);
  root.style.setProperty("--info-foreground", colors.info);
  root.style.setProperty("--success-foreground", colors.success);
  root.style.setProperty("--warning-foreground", colors.warning);
  root.style.setProperty("--app-chrome-background", colors.background);
}

/** Remove all custom theme CSS variable overrides from :root */
export function clearCustomThemeColors(): void {
  const root = document.documentElement;
  for (const key of CSS_VAR_KEYS) {
    root.style.removeProperty(`--${key}`);
    if (key === "card" || key === "popover") {
      root.style.removeProperty(`--${key}-foreground`);
    }
  }
  root.style.removeProperty("--primary-foreground");
  root.style.removeProperty("--secondary-foreground");
  root.style.removeProperty("--muted-foreground");
  root.style.removeProperty("--accent-foreground");
  root.style.removeProperty("--destructive-foreground");
  root.style.removeProperty("--info-foreground");
  root.style.removeProperty("--success-foreground");
  root.style.removeProperty("--warning-foreground");
  root.style.removeProperty("--app-chrome-background");
}

const CUSTOM_THEMES_STORAGE_KEY = "t3code:custom-themes";
const ACTIVE_CUSTOM_THEME_KEY = "t3code:custom-theme-name";

export function loadUserThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomTheme[]) : [];
  } catch {
    return [];
  }
}

export function saveUserThemes(themes: CustomTheme[]): void {
  localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
}

export function getActiveCustomThemeName(): string | null {
  return localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY);
}

export function setActiveCustomThemeName(name: string | null): void {
  if (name) {
    localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, name);
  } else {
    localStorage.removeItem(ACTIVE_CUSTOM_THEME_KEY);
  }
}
