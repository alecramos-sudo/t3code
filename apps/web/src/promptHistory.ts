/**
 * Prompt history — shell-style up/down arrow recall for the chat composer.
 *
 * Stores sent prompts in localStorage so they survive page reloads.
 * History is global (not per-thread) — just like a shell's ~/.bash_history.
 */

const STORAGE_KEY = "t3code:prompt-history";
const MAX_HISTORY = 200;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable — silently ignore.
  }
}

// In-memory mirror so reads are fast.
let cache: string[] | null = null;

function getHistory(): string[] {
  if (!cache) cache = loadHistory();
  return cache;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Append a prompt to the end of history. Deduplicates consecutive repeats. */
export function recordPrompt(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  const history = getHistory();
  // Don't store consecutive duplicates (like bash HISTCONTROL=ignoredups).
  if (history.length > 0 && history[history.length - 1] === trimmed) return;

  history.push(trimmed);
  // Evict oldest entries when the cap is exceeded.
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  cache = history;
  saveHistory(history);
}

/** Total number of stored history entries. */
export function historyLength(): number {
  return getHistory().length;
}

/**
 * Get a history entry by index (0 = oldest, length-1 = newest).
 * Returns `undefined` for out-of-range indices.
 */
export function historyAt(index: number): string | undefined {
  return getHistory()[index];
}
