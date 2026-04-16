import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ResolvedKeybindingRule } from "@t3tools/contracts";
import { useServerKeybindings } from "../../rpc/serverState";
import { ensureLocalApi } from "../../localApi";
import { cn, isMacPlatform } from "../../lib/utils";

/** Human-readable labels for each keybinding command. */
const COMMAND_LABELS: Partial<Record<string, string>> = {
  "terminal.toggle": "Toggle terminal",
  "terminal.split": "Split terminal",
  "terminal.new": "New terminal",
  "terminal.close": "Close terminal",
  "diff.toggle": "Toggle diff panel",
  "commandPalette.toggle": "Command palette",
  "commandPalette.addProject": "Add project",
  "chat.new": "New chat",
  "chat.newLocal": "New local chat",
  "editor.openFavorite": "Open in editor",
  "thread.previous": "Previous thread",
  "thread.next": "Next thread",
};

for (let i = 1; i <= 9; i++) {
  COMMAND_LABELS[`thread.jump.${i}`] = `Jump to thread ${i}`;
}

function formatShortcut(rule: ResolvedKeybindingRule, platform: string): string {
  const isMac = isMacPlatform(platform);
  const parts: string[] = [];

  if (rule.shortcut.modKey) {
    parts.push(isMac ? "\u2318" : "Ctrl");
  } else {
    if (rule.shortcut.ctrlKey) parts.push(isMac ? "\u2303" : "Ctrl");
    if (rule.shortcut.metaKey) parts.push(isMac ? "\u2318" : "Win");
  }
  if (rule.shortcut.shiftKey) parts.push(isMac ? "\u21E7" : "Shift");
  if (rule.shortcut.altKey) parts.push(isMac ? "\u2325" : "Alt");

  const key = rule.shortcut.key.length === 1 ? rule.shortcut.key.toUpperCase() : rule.shortcut.key;
  parts.push(key);

  return isMac ? parts.join("") : parts.join("+");
}

function captureKeyCombo(event: KeyboardEvent): string | null {
  // Ignore bare modifier presses
  if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return null;

  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");

  let key = event.key.toLowerCase();
  if (key === " ") key = "space";
  if (key === "escape") key = "esc";
  parts.push(key);

  return parts.join("+");
}

interface KeybindingRowProps {
  rule: ResolvedKeybindingRule;
  platform: string;
}

const KeybindingRow = memo(function KeybindingRow({ rule, platform }: KeybindingRowProps) {
  const [capturing, setCapturing] = useState(false);
  const captureRef = useRef<HTMLButtonElement>(null);

  const startCapture = useCallback(() => setCapturing(true), []);

  useEffect(() => {
    if (!capturing) return;

    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setCapturing(false);
        return;
      }

      const combo = captureKeyCombo(event);
      if (!combo) return;

      // Save via RPC — upsertKeybinding takes KeybindingRule directly
      void ensureLocalApi()
        .server.upsertKeybinding({
          key: combo,
          command: rule.command,
        })
        .catch((err) => {
          console.warn("Failed to save keybinding", err);
        });

      setCapturing(false);
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [capturing, rule.command]);

  useEffect(() => {
    if (capturing) captureRef.current?.focus();
  }, [capturing]);

  const label = COMMAND_LABELS[rule.command] ?? rule.command;
  const shortcutDisplay = formatShortcut(rule, platform);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-foreground/90">{label}</span>
        {rule.whenAst && (
          <span className="text-[10px] text-muted-foreground/60">
            {rule.whenAst.type === "not" && rule.whenAst.node.type === "identifier"
              ? `when: !${rule.whenAst.node.name}`
              : rule.whenAst.type === "identifier"
                ? `when: ${rule.whenAst.name}`
                : "conditional"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {capturing ? (
          <button
            ref={captureRef}
            type="button"
            className="rounded border border-primary/50 bg-primary/10 px-2.5 py-1 font-mono text-[11px] text-primary outline-none ring-1 ring-primary/30 animate-pulse"
            onBlur={() => setCapturing(false)}
          >
            Press keys...
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "rounded border border-border/60 bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-foreground/80",
              "hover:border-border hover:bg-muted/70 transition-colors cursor-pointer",
            )}
            onClick={startCapture}
            title="Click to rebind"
          >
            {shortcutDisplay}
          </button>
        )}
      </div>
    </div>
  );
});

export const KeybindingEditor = memo(function KeybindingEditor() {
  const keybindings = useServerKeybindings();
  const platform = navigator.platform;

  // Group by unique command (skip thread jump bindings for cleanliness)
  const visibleBindings = keybindings.filter(
    (rule) => !rule.command.startsWith("thread.jump."),
  );

  if (visibleBindings.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground/60">No keybindings configured.</p>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {visibleBindings.map((rule, i) => (
        <KeybindingRow
          key={`${rule.command}-${i}`}
          rule={rule}
          platform={platform}
        />
      ))}
    </div>
  );
});
