import { memo, useCallback, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import {
  THEME_PRESETS,
  loadUserThemes,
  saveUserThemes,
  type CustomTheme,
} from "../../themes/presets";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { CheckIcon, CopyIcon, UploadIcon } from "lucide-react";

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: CustomTheme;
  isActive: boolean;
  onSelect: () => void;
}) {
  const c = theme.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors",
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/60 hover:border-border hover:bg-muted/30",
      )}
    >
      {isActive && <CheckIcon className="absolute top-1.5 right-1.5 size-3 text-primary" />}
      {/* Color swatches */}
      <div className="flex gap-0.5">
        <div
          className="h-5 flex-1 rounded-sm"
          style={{ backgroundColor: c.background }}
          title="background"
        />
        <div
          className="h-5 flex-1 rounded-sm"
          style={{ backgroundColor: c.primary }}
          title="primary"
        />
        <div
          className="h-5 flex-1 rounded-sm"
          style={{ backgroundColor: c.accent }}
          title="accent"
        />
        <div className="h-5 flex-1 rounded-sm" style={{ backgroundColor: c.card }} title="card" />
        <div
          className="h-5 flex-1 rounded-sm"
          style={{ backgroundColor: c.destructive }}
          title="destructive"
        />
      </div>
      <span className="text-[10px] font-medium text-foreground/80">{theme.name}</span>
    </button>
  );
}

function BuiltInThemeCard({
  label,
  mode,
  isActive,
  onSelect,
}: {
  label: string;
  mode: "light" | "dark" | "system";
  isActive: boolean;
  onSelect: () => void;
}) {
  const isLight = mode === "light" || mode === "system";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors",
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/60 hover:border-border hover:bg-muted/30",
      )}
    >
      {isActive && <CheckIcon className="absolute top-1.5 right-1.5 size-3 text-primary" />}
      <div className="flex gap-0.5">
        <div className={cn("h-5 flex-1 rounded-sm", isLight ? "bg-white" : "bg-neutral-900")} />
        <div className={cn("h-5 flex-1 rounded-sm", isLight ? "bg-blue-500" : "bg-blue-400")} />
        <div
          className={cn("h-5 flex-1 rounded-sm", isLight ? "bg-neutral-100" : "bg-neutral-800")}
        />
        <div
          className={cn("h-5 flex-1 rounded-sm", isLight ? "bg-neutral-200" : "bg-neutral-700")}
        />
        <div className={cn("h-5 flex-1 rounded-sm", isLight ? "bg-red-500" : "bg-red-400")} />
      </div>
      <span className="text-[10px] font-medium text-foreground/80">{label}</span>
    </button>
  );
}

export const ThemePicker = memo(function ThemePicker() {
  const { theme, setTheme, customThemeName, setCustomTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userThemes = loadUserThemes();

  const handleExport = useCallback(() => {
    if (!customThemeName) return;
    const allThemes = [...THEME_PRESETS, ...loadUserThemes()];
    const active = allThemes.find((t) => t.name === customThemeName);
    if (!active) return;

    void navigator.clipboard.writeText(JSON.stringify(active, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [customThemeName]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string) as CustomTheme;
          if (!imported.name || !imported.base || !imported.colors) {
            throw new Error("Invalid theme format");
          }
          const existing = loadUserThemes();
          const filtered = existing.filter((t) => t.name !== imported.name);
          saveUserThemes([...filtered, imported]);
          setCustomTheme(imported.name);
        } catch (err) {
          console.warn("Failed to import theme", err);
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    [setCustomTheme],
  );

  const isBuiltIn = !customThemeName;

  return (
    <div className="space-y-3">
      {/* Built-in themes */}
      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Built-in
        </p>
        <div className="grid grid-cols-3 gap-2">
          <BuiltInThemeCard
            label="Light"
            mode="light"
            isActive={isBuiltIn && theme === "light"}
            onSelect={() => setTheme("light")}
          />
          <BuiltInThemeCard
            label="Dark"
            mode="dark"
            isActive={isBuiltIn && theme === "dark"}
            onSelect={() => setTheme("dark")}
          />
          <BuiltInThemeCard
            label="System"
            mode="system"
            isActive={isBuiltIn && theme === "system"}
            onSelect={() => setTheme("system")}
          />
        </div>
      </div>

      {/* Preset themes */}
      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Color themes
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEME_PRESETS.map((preset) => (
            <ThemeCard
              key={preset.name}
              theme={preset}
              isActive={customThemeName === preset.name}
              onSelect={() => setCustomTheme(preset.name)}
            />
          ))}
          {userThemes.map((ut) => (
            <ThemeCard
              key={`user:${ut.name}`}
              theme={ut}
              isActive={customThemeName === ut.name}
              onSelect={() => setCustomTheme(ut.name)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border/40 pt-2">
        <Button size="xs" variant="ghost" onClick={handleImport}>
          <UploadIcon className="mr-1 size-3" />
          Import JSON
        </Button>
        {customThemeName && (
          <Button size="xs" variant="ghost" onClick={handleExport}>
            <CopyIcon className="mr-1 size-3" />
            {copied ? "Copied!" : "Export JSON"}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
});
