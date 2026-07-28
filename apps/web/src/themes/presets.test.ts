import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { applyCustomThemeColors, clearCustomThemeColors, THEME_PRESETS } from "./presets";

type FakeStyleDeclaration = Pick<
  CSSStyleDeclaration,
  "getPropertyValue" | "removeProperty" | "setProperty"
> & {
  attributes: Map<string, string>;
};

function createStyleDeclaration(): FakeStyleDeclaration {
  const properties = new Map<string, string>();
  const attributes = new Map<string, string>();
  return {
    attributes,
    getPropertyValue: (name) => properties.get(name) ?? "",
    removeProperty: (name) => {
      const previous = properties.get(name) ?? "";
      properties.delete(name);
      return previous;
    },
    setProperty: (name, value) => {
      properties.set(name, value ?? "");
    },
  };
}

function readRootVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name);
}

beforeEach(() => {
  const style = createStyleDeclaration();
  vi.stubGlobal("document", {
    documentElement: {
      removeAttribute: (name: string) => {
        style.attributes.delete(name);
      },
      setAttribute: (name: string, value: string) => {
        style.attributes.set(name, value);
      },
      style,
    },
  });
});

afterEach(() => {
  clearCustomThemeColors();
  vi.unstubAllGlobals();
});

describe("custom theme presets", () => {
  it("derives readable accent text and sidebar colors for Cobalt2", () => {
    const cobalt2 = THEME_PRESETS.find((theme) => theme.name === "Cobalt2");
    expect(cobalt2).toBeDefined();
    if (!cobalt2) return;

    applyCustomThemeColors(cobalt2.colors, cobalt2.base);

    expect(readRootVar("--accent")).toBe("#80FCFF");
    expect(readRootVar("--accent-foreground")).toBe("#000000");
    expect(readRootVar("--custom-theme-accent-foreground")).toBe("#000000");
    expect(readRootVar("--sidebar")).toBe(cobalt2.colors.card);
    expect(readRootVar("--custom-theme-sidebar")).toBe(cobalt2.colors.card);
    expect(readRootVar("--sidebar-foreground")).toBe(cobalt2.colors.foreground);
    expect(readRootVar("--sidebar-control-surface")).toBe(cobalt2.colors.secondary);
    expect(readRootVar("--sidebar-row-hover")).toBe(cobalt2.colors.secondary);
    expect(readRootVar("--sidebar-row-active")).toBe(cobalt2.colors.muted);
    expect(readRootVar("--sidebar-border")).toBe(cobalt2.colors.border);
  });

  it("clears custom sidebar variables when leaving a preset", () => {
    const cobalt2 = THEME_PRESETS.find((theme) => theme.name === "Cobalt2");
    expect(cobalt2).toBeDefined();
    if (!cobalt2) return;

    applyCustomThemeColors(cobalt2.colors, cobalt2.base);
    clearCustomThemeColors();

    expect(readRootVar("--sidebar")).toBe("");
    expect(readRootVar("--custom-theme-sidebar")).toBe("");
    expect(readRootVar("--sidebar-foreground")).toBe("");
    expect(readRootVar("--sidebar-row-hover")).toBe("");
    expect(readRootVar("--sidebar-stage-fade")).toBe("");
  });
});
