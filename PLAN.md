# t3code Dev Build — 4 Feature Plan

## Overview

Four features for our personal dev build (`dev-build` branch), built on top of nightly `v0.0.18` + PR #1923.

---

## Feature 1: Project Sync (Dev ↔ Prod)

### Problem
Dev build uses `~/.t3/dev/state.sqlite` while the nightly DMG uses `~/.t3/userdata/state.sqlite`. Projects added in one don't appear in the other.

### Architecture
```
~/.t3/
├── dev/state.sqlite          ← dev build reads this
├── userdata/state.sqlite     ← production DMG reads this
```

The split is in `apps/server/src/config.ts:deriveServerPaths()`:
```ts
const stateDir = join(baseDir, devUrl !== undefined ? "dev" : "userdata");
```

Projects live in the `projection_projects` table (event-sourced from `orchestration_events`).

### Approach: Settings UI with Sync Button

Rather than automatic bidirectional sync (complex, conflict-prone), we add a **one-click import** in the Settings panel.

#### Changes

**1. Server endpoint** — `apps/server/src/ws.ts`
- New RPC method: `syncProjectsFromSource`
- Accepts `source: "dev" | "userdata"`
- Opens the *other* SQLite DB read-only
- Reads all `projection_projects` rows
- For each project not already present locally, creates an `orchestration_event` of type `project.created` (preserving the event-sourcing pattern)
- Returns `{ imported: number, skipped: number }`

**2. Contract** — `packages/contracts/src/orchestration.ts`
- Add `syncProjectsFromSource` to the WS method types

**3. Settings UI** — `apps/web/src/components/settings/SettingsPanels.tsx`
- New section: **"Project Sync"** in General settings
- Shows current data source (dev vs userdata)
- Button: "Import projects from [production/dev]"
- Shows result toast: "Imported 12 projects, skipped 3 duplicates"

#### Key files
| File | Change |
|------|--------|
| `apps/server/src/config.ts` | Export helper to resolve the *other* DB path |
| `apps/server/src/ws.ts` | New `syncProjectsFromSource` RPC handler |
| `packages/contracts/src/orchestration.ts` | Add method type |
| `apps/web/src/components/settings/SettingsPanels.tsx` | Sync UI section |

---

## Feature 2: Custom Keymapping UI

### Problem
Keybindings are only editable by manually opening `keybindings.json`. No in-app UI.

### Current System
- Contracts: `packages/contracts/src/keybindings.ts` — `KeybindingRule { key, command, when? }`
- Server: `apps/server/src/keybindings.ts` — file-watching service, `upsertKeybindingRule()`, atomic writes
- UI: Settings panel just has an "Open file" button
- Storage: `~/.t3/{dev|userdata}/keybindings.json`

12 default bindings exist (mod+j, mod+k, mod+n, etc). No `addProject` command exists yet.

### Approach: In-App Keybinding Editor + New Commands

#### Changes

**1. New command** — `packages/contracts/src/keybindings.ts`
- Add `"commandPalette.addProject"` to `KeybindingCommand` union
- Add `"editor.openFavorite"` shortcut display name mapping

**2. Keybinding editor component** — `apps/web/src/components/settings/KeybindingEditor.tsx` (new)
- Table layout: Command | Current Shortcut | Edit button
- Click "Edit" → enters capture mode (listens for next keypress combo)
- Shows modifier keys visually (e.g. `⌘ ⇧ P`)
- "Reset to default" per-binding
- Conflict detection: warns if shortcut already used
- Calls `upsertKeybindingRule` via existing WS method

**3. Settings integration** — `apps/web/src/components/settings/SettingsPanels.tsx`
- Replace the "Open file" button with the new `<KeybindingEditor />` component
- Keep "Open file" as a secondary action for power users

**4. Wire up addProject command** — `apps/web/src/components/Sidebar.tsx`
- Register `commandPalette.addProject` in the keybinding resolver
- Default binding: `mod+shift+p`

#### Key files
| File | Change |
|------|--------|
| `packages/contracts/src/keybindings.ts` | Add new commands to union type |
| `apps/server/src/keybindings.ts` | Add default binding for addProject |
| `apps/web/src/components/settings/KeybindingEditor.tsx` | New component |
| `apps/web/src/components/settings/SettingsPanels.tsx` | Integrate editor |
| `apps/web/src/components/Sidebar.tsx` | Wire addProject command |

---

## Feature 3: Custom Theme System

### Problem
Only light/dark/system. No custom colors, no shareable themes.

### Current System
- Client-only: `useTheme()` hook in `apps/web/src/hooks/useTheme.ts`
- Storage: `localStorage("t3code:theme")` — values: `"light" | "dark" | "system"`
- CSS: `apps/web/src/index.css` — ~20 CSS custom properties (`--background`, `--foreground`, `--primary`, etc.)
- Applies `.dark` class on `<html>` element
- Desktop bridge: `window.desktopBridge.setTheme()`
- NOT in server settings — purely client-side

### Approach: JSON Theme Files + Theme Picker UI

#### Theme Format
```json
{
  "name": "Nord Dark",
  "author": "alec@peakperspective.media",
  "base": "dark",
  "colors": {
    "background": "#2E3440",
    "foreground": "#D8DEE9",
    "primary": "#88C0D0",
    "secondary": "#3B4252",
    "accent": "#81A1C1",
    "muted": "#4C566A",
    "border": "#434C5E",
    "destructive": "#BF616A",
    "success": "#A3BE8C",
    "warning": "#EBCB8B",
    "info": "#5E81AC",
    "card": "#3B4252",
    "popover": "#3B4252",
    "input": "#4C566A",
    "ring": "#88C0D0"
  }
}
```

`base: "dark" | "light"` determines which base styles to inherit from (font colors, scrollbar styles, etc).

#### Changes

**1. Theme types** — `packages/contracts/src/theme.ts` (new)
- `CustomTheme` schema with name, author, base, colors
- `ThemeColors` schema with all CSS variable keys
- Export/import validation

**2. Theme engine** — `apps/web/src/hooks/useTheme.ts`
- Extend `Theme` type: `"light" | "dark" | "system" | "custom:{name}"`
- New: `applyCustomTheme(theme: CustomTheme)` — injects CSS variables on `:root`
- Store custom themes in `localStorage("t3code:custom-themes")` as JSON array
- `useThemeStore()` zustand store for theme list management

**3. Theme picker UI** — `apps/web/src/components/settings/ThemePicker.tsx` (new)
- Grid of theme preview cards (small rectangles showing color palette)
- Built-in themes: Light, Dark, Nord Dark, Solarized, Dracula, Monokai, Catppuccin
- "Import theme" button — paste JSON or load from file
- "Export theme" button — copies JSON to clipboard
- "Create theme" — opens color picker grid for each variable
- Live preview as you hover

**4. Settings integration** — `apps/web/src/components/settings/SettingsPanels.tsx`
- Replace the 3-option theme selector with `<ThemePicker />`

**5. Built-in theme presets** — `apps/web/src/themes/` (new directory)
- `presets.ts` — Array of `CustomTheme` objects for bundled themes
- Start with 5-6 popular dark/light themes

#### Key files
| File | Change |
|------|--------|
| `packages/contracts/src/theme.ts` | New — theme schema |
| `apps/web/src/hooks/useTheme.ts` | Extend for custom themes |
| `apps/web/src/components/settings/ThemePicker.tsx` | New — theme picker UI |
| `apps/web/src/components/settings/SettingsPanels.tsx` | Integrate picker |
| `apps/web/src/themes/presets.ts` | New — bundled theme presets |
| `apps/web/src/index.css` | Ensure all color vars are overridable |

---

## Feature 4: Auto-Collapse Changed Files in Long Diffs

### Problem
Long diffs show a full expanded file tree at the end, pushing important content out of view.

### Current System
- `apps/web/src/components/chat/ChangedFilesTree.tsx` — renders the tree
- Props include `allDirectoriesExpanded: boolean`
- State: `expandedDirs: Set<string>` — manual toggle per directory
- `apps/web/src/components/chat/MessagesTimeline.tsx` — integrates ChangedFilesTree
- `apps/web/src/lib/turnDiffTree.ts` — builds tree structure, has `summarizeTurnDiffStats()`

### Approach: Collapse by Default When File Count Exceeds Threshold

#### Changes

**1. Auto-collapse logic** — `apps/web/src/components/chat/ChangedFilesTree.tsx`
- New prop: `autoCollapse?: boolean` (default true)
- Threshold: if `files.length > 5`, start collapsed (show summary bar only)
- Summary bar: "12 files changed (+145 / -32)" with expand chevron
- Click to expand full tree
- User can still toggle individual directories

**2. Settings option** — `packages/contracts/src/settings.ts`
- Add `diffAutoCollapseThreshold: number` to `ClientSettingsSchema` (default: 5)
- Add to settings UI as a number input

**3. Summary bar component** — `apps/web/src/components/chat/ChangedFilesSummary.tsx` (new)
- Compact one-liner: file count + total additions/deletions
- Chevron toggle to expand full tree
- Uses `summarizeTurnDiffStats()` from turnDiffTree.ts

**4. Timeline integration** — `apps/web/src/components/chat/MessagesTimeline.tsx`
- Pass threshold setting to ChangedFilesTree
- Default collapsed state based on file count vs threshold

#### Key files
| File | Change |
|------|--------|
| `apps/web/src/components/chat/ChangedFilesTree.tsx` | Add collapse logic + summary |
| `apps/web/src/components/chat/ChangedFilesSummary.tsx` | New — compact summary bar |
| `apps/web/src/components/chat/MessagesTimeline.tsx` | Pass threshold, wire collapse |
| `packages/contracts/src/settings.ts` | Add threshold setting |
| `apps/web/src/components/settings/SettingsPanels.tsx` | Add threshold to UI |

---

## Implementation Order

1. **Feature 4** (auto-collapse) — Smallest scope, immediate UX win, ~30 min
2. **Feature 1** (project sync) — High value, moderate scope, ~1 hr
3. **Feature 2** (keymapping UI) — Medium scope, builds on existing infra, ~1 hr
4. **Feature 3** (custom themes) — Largest scope, most new code, ~2 hrs

## Branch Strategy

All work on `dev-build` branch. Each feature gets its own commit for clean history.
