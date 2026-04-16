# T3 Code — Extracted Rules & Conventions

Reverse-engineered from ~1,000 commits, architecture docs, code patterns, and Julius Marminge's development approach. These rules capture the "vibe coding, no slop" philosophy.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Commit & PR Discipline](#2-commit--pr-discipline)
3. [Project Structure](#3-project-structure)
4. [TypeScript Rules](#4-typescript-rules)
5. [Effect-TS Patterns](#5-effect-ts-patterns)
6. [React & Frontend Rules](#6-react--frontend-rules)
7. [State Management](#7-state-management)
8. [Testing Rules](#8-testing-rules)
9. [Naming Conventions](#9-naming-conventions)
10. [Import Organization](#10-import-organization)
11. [Error Handling](#11-error-handling)
12. [Comments & Documentation](#12-comments--documentation)
13. [Performance Rules](#13-performance-rules)
14. [Module Design](#14-module-design)
15. [Tooling & Formatting](#15-tooling--formatting)
16. [General Programming Principles](#16-general-programming-principles)

---

## 1. Philosophy

### Core priorities (in order)

1. **Correctness** — the system does what it claims under all conditions
2. **Reliability** — predictable behavior under load, failure, reconnect, partial streams
3. **Performance** — fast, but never at the cost of correctness
4. **Maintainability** — long-term clarity over short-term convenience

### The "no slop" standard

- No dead code. No commented-out code. No `TODO`/`FIXME` comments left behind.
- No shortcuts that add local logic to "just make it work." If solving a problem reveals shared logic, extract it.
- No gratuitous abstraction. Every layer exists because it carries weight.
- If a tradeoff is required, choose robustness over convenience.

### Julius's vocabulary tells you the mindset

His commit messages use words like **Harden**, **Stabilize**, **Prevent … from regressing**, **Guard against**, **Backfill**, **Coalesce**, **Memoize**, **Warm**. This is a correctness-first, defensive-programming mindset. Not "make it work" — "make it impossible to break."

---

## 2. Commit & PR Discipline

### Commit message style

- **Sentence-case, imperative mood, no conventional commit prefix.**
  - ✅ `Backfill projected shell summaries and stale approval cleanup`
  - ✅ `Memoize derived thread reads`
  - ✅ `Prevent live thread branches from regressing to temp worktree names`
  - ❌ `feat: add shell summaries`
  - ❌ `fixed the branch thing`
- **Verb-first action descriptions**: Add, Fix, Improve, Cache, Refresh, Warm, Coalesce, Migrate, Preserve, Stabilize, Harden, Handle, Remove, Extract, Pad.
- **Single-line summaries, no body text.** The PR number `(#NNNN)` is appended.
- External contributor PRs may use conventional commits — that's accepted. The project's own style does not use them.

### PR expectations

- **Small and focused.** One concern per PR.
- **Explain what changed AND why it should exist.**
- **Don't mix unrelated fixes.**
- UI changes require before/after screenshots. Interaction changes require video.
- Large drive-by feature PRs get closed immediately.

### WIP branch style

Feature branch commits can be informal (`rm`, `kewl`, `composer`). They live on the branch and get squash-merged. The public history stays clean.

---

## 3. Project Structure

### Monorepo layout

```
apps/
  server/     — Node.js WebSocket server (Bun runtime)
  web/        — React/Vite SPA
  desktop/    — Electron wrapper
  marketing/  — Astro marketing site
packages/
  contracts/  — Schema-only shared types (Effect Schema)
  shared/     — Runtime utilities (explicit subpath exports)
  client-runtime/ — Minimal client runtime
scripts/      — Build/release tooling
```

### Package boundary rules

| Package | Purpose | Export style | Runtime logic? |
|---------|---------|-------------|---------------|
| `contracts` | Schemas, types, RPC definitions | Barrel index (`export *`) | **No** — schema-only |
| `shared` | Runtime utilities | Explicit subpath exports (`@t3tools/shared/git`) | Yes |
| `server` | Server application | Internal only | Yes |
| `web` | Web application | Internal only | Yes |

### `contracts` is the single source of truth

All types shared between server and web live in `packages/contracts/src/` as Effect Schema definitions. No ad-hoc type duplication across packages.

### `shared` uses explicit subpath exports — no barrel

```json
// package.json exports
"./model": { "types": "./src/model.ts", "import": "./src/model.ts" },
"./git":   { "types": "./src/git.ts",   "import": "./src/git.ts" }
```

Consumed as:
```typescript
import { normalizeModelSlug } from "@t3tools/shared/model";
import { isTemporaryWorktreeBranch } from "@t3tools/shared/git";
```

This enables precise tree-shaking and clear dependency boundaries.

### Directory conventions within `apps/server/`

```
src/
  auth/           — Authentication
  checkpointing/  — Workspace snapshots & diffs
  environment/    — Runtime environment detection
  git/            — Git operations
  observability/  — Logging & tracing
  orchestration/  — Event-sourced domain model
  persistence/    — SQLite database layer
  project/        — Project management
  provider/       — AI provider adapters (Codex, Claude)
  telemetry/      — Analytics
  terminal/       — PTY management
  workspace/      — Workspace management
```

Each domain directory follows:
```
domain/
  Services/       — Interface definitions (Context.Service tags)
  Layers/         — Layer implementations
  *.ts            — Shared types, errors, pure logic
```

### File co-location

- `Foo.ts` + `Foo.test.ts` in the same directory
- `Component.tsx` + `Component.logic.ts` + `Component.logic.test.ts` for components with extractable logic
- `Component.browser.tsx` for Playwright browser-level integration tests
- Migrations numbered sequentially: `024_BackfillProjectionThreadShellSummary.ts`

---

## 4. TypeScript Rules

### Strictness — non-negotiable

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "useDefineForClassFields": true,
  "forceConsistentCasingInFileNames": true
}
```

### `readonly` everywhere

All interface fields, function parameters, array types, and return types use `readonly`:

```typescript
export interface CodexAppServerSendTurnInput {
  readonly threadId: ThreadId;
  readonly input?: string;
  readonly attachments?: ReadonlyArray<{ type: "image"; url: string }>;
}
```

### No `any`. Ever.

Use `unknown` with type narrowing. The only exception is generic RPC type helpers in conditional type positions.

### No `enum`. Ever.

Use `Schema.Literals([...])` for discriminated unions:

```typescript
export const RuntimeMode = Schema.Literals([
  "approval-required",
  "auto-accept-edits",
  "full-access",
]);
```

### No default exports. Ever.

Everything is named exports. Every file, every module, every component.

### Branded types for entity IDs

```typescript
const makeEntityId = <Brand extends string>(brand: Brand) =>
  TrimmedNonEmptyString.pipe(Schema.brand(brand));

export const ThreadId = makeEntityId("ThreadId");
export const TurnId = makeEntityId("TurnId");
export const ProjectId = makeEntityId("ProjectId");
```

### `as const` for object literals and tuples

```typescript
export const WS_METHODS = { ... } as const;
[message.id, message] as const;
```

### `satisfies` for implementation validation

```typescript
return { ... } satisfies ServerLifecycleEventsShape;
return { ... } satisfies NetServiceShape;
```

### Underscore prefix for unused destructured values

```typescript
const { [threadId]: _removedShell, ...threadShellById } = state.threadShellById;
const { bootstrap: _bootstrap, ...finalTurnStartCommand } = command;
```

### Numeric literals with underscores for readability

```typescript
const TIMEOUT = 4_000;
const MAX_SIZE = 10 * 1024 * 1024;
const CONTEXT_WINDOW = 14_000_000;
```

---

## 5. Effect-TS Patterns

### Version & commitment level

Effect 4.0.0-beta.45. Not an add-on — it IS the programming model for the entire server and contracts layer.

### Service definition pattern

```typescript
// 1. Interface shape
export interface ServerLifecycleEventsShape {
  readonly publish: (event: ...) => Effect.Effect<...>;
  readonly snapshot: Effect.Effect<SnapshotState>;
  readonly stream: Stream.Stream<...>;
}

// 2. Service tag
export class ServerLifecycleEvents extends Context.Service<
  ServerLifecycleEvents,
  ServerLifecycleEventsShape
>()("t3/serverLifecycleEvents") {}

// 3. Layer implementation
export const ServerLifecycleEventsLive = Layer.effect(
  ServerLifecycleEvents,
  Effect.gen(function* () {
    // ...
    return { ... } satisfies ServerLifecycleEventsShape;
  }),
);
```

### `Effect.fn` for named generator functions

```typescript
// Preferred (named, pipeable)
const deriveServerPaths = Effect.fn("deriveServerPaths")(
  function* (baseDir: string, devUrl: string): Effect.fn.Return<ServerDerivedPaths, never, Path.Path> {
    const { join } = yield* Path.Path;
    // ...
  },
);

// Acceptable for anonymous closures
Effect.gen(function* () { ... });
```

### Selective imports, not barrel

```typescript
// YES
import { Effect, Layer, Option, Queue, Ref, Schema, Stream } from "effect";

// NO
import * as E from "effect";
```

### Layer composition via `provideMerge` chains

```typescript
const RuntimeDependenciesLive = ReactorLayerLive.pipe(
  Layer.provideMerge(CheckpointingLayerLive),
  Layer.provideMerge(GitLayerLive),
  Layer.provideMerge(OrchestrationLayerLive),
);
```

### Error types via `Schema.TaggedErrorClass`

```typescript
export class OrchestrationGetSnapshotError extends Schema.TaggedErrorClass<OrchestrationGetSnapshotError>()(
  "OrchestrationGetSnapshotError",
  {
    message: TrimmedNonEmptyString,
    cause: Schema.optional(Schema.Defect),
  },
) {}
```

### Effect error handling idioms

| Pattern | Use when |
|---------|----------|
| `Effect.mapError` | Lifting raw errors into domain-specific tagged errors |
| `Effect.catchTag` | Discriminated error matching by `_tag` |
| `Effect.ignoreCause({ log: true })` | Fire-and-forget cleanup that shouldn't fail the parent |
| `Effect.catchCause` | Inspecting full cause trees for observability |
| `Effect.acquireRelease` | Resource lifecycle (connections, sessions, locks) |

### Resource lifecycle

```typescript
Effect.acquireUseRelease(
  sessions.markConnected(session.sessionId),
  () => rpcWebSocketHttpEffect,
  () => sessions.markDisconnected(session.sessionId),
);
```

### Background work

```typescript
// Detached, fire-and-forget with logging
pipe(effect, Effect.ignoreCause({ log: true }), Effect.forkDetach, Effect.asVoid);

// Scoped (cancelled when scope closes)
Effect.forkScoped(longRunningStream);
```

### Streams

- `Stream.fromPubSub` for event bus consumption
- `Stream.callback` for wrapping imperative event sources
- `Stream.concat(snapshotStream, liveStream)` for replay + live
- `Stream.debounce`, `Stream.filter`, `Stream.mapEffect` for transformation

### RPC definitions

```typescript
export const WsGitPullRpc = Rpc.make(WS_METHODS.gitPull, {
  payload: GitPullInput,
  success: GitPullResult,
  error: GitCommandError,
});

// Streaming variant
export const WsSubscribeGitStatusRpc = Rpc.make(WS_METHODS.subscribeGitStatus, {
  payload: GitStatusInput,
  success: GitStatusStreamEvent,
  error: GitManagerServiceError,
  stream: true,
});
```

### Effect language service enforcement

```json
"diagnosticSeverity": {
  "importFromBarrel": "error",
  "anyUnknownInErrorContext": "warning",
  "instanceOfSchema": "warning",
  "deterministicKeys": "warning"
}
```

---

## 6. React & Frontend Rules

### Stack

- React 19 with React Compiler (automatic memoization — fewer manual `useMemo`/`useCallback`)
- TanStack Router (file-based routing)
- TanStack React Query (server state/caching)
- Tailwind CSS v4 with shadcn/ui conventions
- Lexical (rich text editor)
- xterm (terminal emulation)
- @legendapp/list (virtualized lists)
- @base-ui/react (headless UI primitives)

### Component file naming

- `PascalCase.tsx` for React components: `ChatView.tsx`, `BranchToolbar.tsx`
- `camelCase.ts` for hooks: `useSettings.ts`, `useTheme.ts`
- Logic extraction: `ChatView.logic.ts` alongside `ChatView.tsx`

### Props over context

Thread callbacks and overrides through props rather than adding new React contexts:

```typescript
// YES — prop threading
<DiffPanel onDiffPanelOpen={handleDiffOpen} activeThreadBranch={branchOverride} />

// NO — new context for one-off data flow
const DiffPanelContext = createContext<...>(...);
```

### Styling

- Tailwind utility classes as the primary styling mechanism
- `class-variance-authority` (CVA) for variant-based component styling
- `tailwind-merge` for className composition
- CSS custom properties for theming (`--background`, `--foreground`, `--primary`)
- Light/dark via CSS custom properties with `@variant dark`
- Manual CSS only for specialized rendering (markdown, scrollbars, terminal, diffs)

### Path alias

```json
// tsconfig.json
"paths": { "~/*": ["./src/*"] }
```

---

## 7. State Management

### Architecture: multiple purpose-specific stores

| Store | Purpose |
|-------|---------|
| `store.ts` (Zustand) | Main orchestration state — environments, threads, messages, sessions |
| `uiStateStore.ts` | Transient UI state |
| `composerDraftStore.ts` | Draft message state with localStorage persistence |
| `terminalStateStore.ts` | Terminal buffer and activity |
| `threadSelectionStore.ts` | Thread selection |
| `commandPaletteStore.ts` | Command palette state |
| `@effect/atom-react` atoms | Reactive state bridging Effect streams into React |

### Zustand patterns

**Pure reducer functions defined outside the store, exported for testing:**

```typescript
// Defined outside store, tested independently
export function applyOrchestrationEvent(state: AppState, event: DomainEvent): AppState { ... }
export function syncServerShellSnapshot(state: AppState, snapshot: ShellSnapshot): AppState { ... }

// Used inside store
set((state) => applyOrchestrationEvent(state, event));
```

**Structural equality checks to prevent unnecessary re-renders:**

```typescript
// Custom equality functions for complex objects
function threadShellsEqual(a: ThreadShell, b: ThreadShell): boolean { ... }
function sidebarThreadSummariesEqual(a: Summary[], b: Summary[]): boolean { ... }
```

**Normalized state shape:**

```typescript
interface EnvironmentState {
  threadIds: ReadonlyArray<ThreadId>;
  threadById: Record<ThreadId, Thread>;
  threadShellById: Record<ThreadId, ThreadShell>;
}
```

**Selector functions are plain functions on state:**

```typescript
export function selectProjectByRef(state: AppState, ref: ProjectRef): Project | undefined { ... }
export function selectThreadByRef(state: AppState, ref: ThreadRef): Thread | undefined { ... }
```

### Immutable state updates

All state changes produce new objects. Spread operator for shallow immutability. Helper functions prevent unnecessary allocations when arrays haven't changed.

---

## 8. Testing Rules

### Non-negotiable: every change gets tests

Even a 2-line production change gets 50+ lines of tests. Every commit, no matter how small, includes tests covering the changed behavior.

### Framework & configs

- **Vitest 4.0** with `@effect/vitest` for Effect-aware utilities
- Server tests: `fileParallelism: false` (tests exercise SQLite/git/orchestration together), 60s timeout
- Browser tests: `@vitest/browser-playwright` with headless Chromium, 30s timeout
- API mocking: `msw` (Mock Service Worker) for browser tests

### Test file conventions

- `Foo.test.ts` co-located with `Foo.ts`
- `Component.browser.tsx` for Playwright browser integration tests
- `Component.logic.test.ts` for pure logic tests

### Test patterns

**Harness factories for complex test setup:**

```typescript
function createSendTurnHarness() {
  const mockSession = { ... };
  const requireSession = vi.spyOn(manager as unknown as { ... }, "requireSession");
  return { mockSession, requireSession, ... };
}
```

**State-based testing for stores:**

```typescript
const initial = makeState({ threads: [makeThread({ id: "t1" })] });
const result = applyOrchestrationEvent(initial, event);
expect(result.threadById["t1"].status).toBe("completed");
```

**Referential stability assertions:**

```typescript
const first = selectThreadExistsByRef(state, ref);
const second = selectThreadExistsByRef(state, ref);
expect(second).toBe(first); // Same reference = memoization works
```

**No mocking frameworks beyond `vi`** — manual spy setup with `vi.spyOn`.

### What tests verify

- Event-sourcing lifecycle scenarios (stale approvals, full lifecycle, edge cases)
- Reconnection and recovery scenarios
- Structural equality and memoization correctness
- Cache invalidation behavior
- Every new edge case from bug fixes

---

## 9. Naming Conventions

### Function prefixes carry semantic meaning

| Prefix | Meaning | Example |
|--------|---------|---------|
| `make*` | Factory/constructor | `makeWsRpcLayer`, `makeDrainableWorker` |
| `build*` | Construct a new derived value | `buildCodexInitializeParams`, `buildMessageSlice` |
| `read*` | Extract/parse from unknown data | `readResumeThreadId`, `readCodexAccountSnapshot` |
| `resolve*` | Lookup with fallback logic | `resolveModelSlug`, `resolveEffort` |
| `normalize*` | Canonicalize input | `normalizeModelSlug`, `normalizeDispatchCommand` |
| `map*` | Transform one domain type to another | `mapSession`, `mapMessage`, `mapThread` |
| `to*` | Type coercion/branding | `toTurnId`, `toProviderItemId` |
| `is*` | Boolean predicate | `isRecoverableThreadResumeError`, `isServerRequest` |
| `derive*` | Compute from existing state | `derivePhase`, `deriveTimelineEntries` |
| `select*` | Zustand store selector | `selectEnvironmentState`, `selectThreadByRef` |
| `apply*` | Reduce an event into state | `applyOrchestrationEvent`, `applyShellEvent` |
| `sync*` | Replace state from server snapshot | `syncServerShellSnapshot`, `syncServerThreadDetail` |
| `write*` | Write to normalized store state | `writeThreadState`, `writeThreadShellState` |
| `ensure*` | Idempotent setup | `ensureThreadRegistered`, `ensureServerDirectories` |
| `retain*` | Filter to keep matching items | `retainThreadMessagesAfterRevert` |
| `append*` | Add to a collection | `appendId`, `appendSetupScriptActivity` |

### Casing rules

| Thing | Convention | Example |
|-------|-----------|---------|
| Functions | camelCase, verb-first | `resolveSessionCookieName` |
| Constants | SCREAMING_SNAKE | `CAPABILITIES_PROBE_TIMEOUT_MS` |
| Effect Services | PascalCase | `ServerSettingsService`, `OrchestrationProjectionPipeline` |
| Service files | PascalCase in `Services/` dir | `OrchestrationEngine.ts` |
| Layer files | PascalCase in `Layers/` dir | `OrchestrationReactor.ts` |
| Shared utility modules | PascalCase | `Net.ts`, `Struct.ts`, `DrainableWorker.ts` |
| Application code files | camelCase | `codexAppServerManager.ts`, `sessionLogic.ts` |
| React components | PascalCase | `ChatView.tsx`, `BranchToolbar.tsx` |
| React hooks | camelCase with `use` prefix | `useSettings.ts`, `useTheme.ts` |
| Logic co-files | camelCase with `.logic.ts` | `ChatView.logic.ts` |

### Private methods

No underscore prefix. Use the `private` keyword.

---

## 10. Import Organization

### Strict 4-group order, separated by blank lines

```typescript
// 1. Node builtins (prefixed node:)
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

// 2. External packages
import { Effect, Layer, Option, Schema, Stream } from "effect";
import { HttpRouter } from "effect/unstable/http";

// 3. Workspace packages
import { ThreadId } from "@t3tools/contracts";
import { normalizeModelSlug } from "@t3tools/shared/model";

// 4. Relative imports
import { ProviderService } from "./provider/Layers/ProviderService";
import type { SessionContext } from "./types";
```

### Selective imports from Effect — never barrel

```typescript
// YES
import { Effect, Layer, Option, Queue, Ref, Schema, Stream } from "effect";

// NO
import * as E from "effect";
```

The only namespace imports allowed are for unstable APIs:
```typescript
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
```

---

## 11. Error Handling

### Server-side: Effect tagged errors

Every error class extends `Schema.TaggedErrorClass` with a `_tag` discriminant. All error types live in `packages/contracts/src/`.

```typescript
export class OrchestrationGetSnapshotError extends Schema.TaggedErrorClass<...>()(
  "OrchestrationGetSnapshotError",
  { message: TrimmedNonEmptyString, cause: Schema.optional(Schema.Defect) },
) {}
```

### No bare `try/catch` in Effect-managed code

Use `Effect.mapError`, `Effect.catchTag`, `Effect.catchCause` instead.

### Imperative code (Codex manager)

Traditional try/catch with explicit error message extraction:
```typescript
const message = error instanceof Error ? error.message : "Failed to start Codex session.";
```

### Web-side: minimal, user-facing

Errors from RPC calls are caught, logged, and sanitized before display. `sanitizeThreadErrorMessage` cleans provider errors.

---

## 12. Comments & Documentation

### Comments are sparse and purposeful

Three acceptable patterns:

**1. JSDoc on service interfaces:**
```typescript
/**
 * OrchestrationEngineService - Service interface for orchestration command handling.
 *
 * Owns command validation/dispatch and in-memory read-model updates...
 */
```

**2. Block comments on ownership boundaries:**
```typescript
// ---------------------------------------------------------------------------
// Thread bookkeeping -- written by BOTH shell stream and detail stream.
// Both streams ensure the thread is registered here; the bookkeeping is
// additive (append-only IDs) so concurrent writes are safe.
// ---------------------------------------------------------------------------
```

**3. Single-line inline comments for important invariants:**
```typescript
// Important: Only `ServerConfig` should be provided by the CLI layer!!!
```

### What you never see

- No `TODO` or `FIXME` comments
- No commented-out code
- No comments restating what code already says
- No noise comments (`// increment counter`, `// return result`)

### Architectural documentation

- `docs/` for public-facing docs (observability, release process, Effect patterns)
- `.docs/` for internal developer docs (architecture, provider system, runtime modes, glossary)
- The encyclopedia (`.docs/encyclopedia.md`) defines domain terminology — use it

---

## 13. Performance Rules

### Memoization is an explicit concern

- Custom structural equality checks prevent unnecessary re-renders (`threadShellsEqual`, `latestTurnsEqual`)
- Lightweight boolean selectors avoid materializing full objects (`selectThreadExistsByRef` instead of full thread read)
- Referential stability is tested: `expect(second).toBe(first)`

### Coalescing and batching

- `KeyedCoalescingWorker` deduplicates concurrent work by key
- `DrainableWorker` orders async work and provides deterministic test synchronization
- Sidebar prewarm limits: `SIDEBAR_THREAD_PREWARM_LIMIT`

### Subscription warming

Commits specifically warm subscriptions before they're needed. "Warm" appears in commit vocabulary.

### React Compiler

React 19 + React Compiler handles automatic memoization. Manual `useMemo`/`useCallback` are rare — the compiler does the work.

### Virtualized rendering

`@legendapp/list` for high-performance virtualized lists. The chat view was explicitly migrated from `@tanstack/react-virtual` to `@legendapp/list` for better performance.

---

## 14. Module Design

### Extract shared logic aggressively

When logic is reused across server/web, extract to `packages/shared` with explicit subpath exports. Julius's diffs show this pattern repeatedly — utility functions start inline, then get promoted to shared packages.

Example: `isTemporaryWorktreeBranch` moved from `ProviderCommandReactor.ts` to `@t3tools/shared/git`.

### No barrel files (except contracts)

`packages/shared` uses explicit subpath exports. This prevents hidden dependency graphs and enables tree-shaking.

### Services vs. Layers split

- `Services/` — interface + `Context.Service` tag (what the service does)
- `Layers/` — implementation (how it does it)
- This separation enables testing with mock layers

### Adapter pattern for providers

Codex and Claude are implemented behind a `ProviderAdapterRegistry`. The uniform interface allows dispatching to different AI backends without changing orchestration logic.

### Event-sourcing in the orchestration model

- **Commands** → validated by invariants → **Events** (source of truth)
- **Projector** applies events to read models
- **Reactors** handle side effects after events
- **Receipts** signal async milestones (no polling)
- **DrainableWorker** keeps async work ordered and test-friendly

---

## 15. Tooling & Formatting

### Linter: oxlint (not ESLint)

Rust-based, orders of magnitude faster. Plugins: `eslint`, `oxc`, `react`, `unicorn`, `typescript`.

```json
{
  "categories": {
    "correctness": "warn",
    "suspicious": "warn",
    "perf": "warn"
  }
}
```

### Formatter: oxfmt (not Prettier)

Rust-based. Configured via `.oxfmtrc.json`. Includes `sortPackageJson`.

### Quality gate

All three must pass before any task is considered complete:
```bash
bun fmt       # oxfmt
bun lint      # oxlint
bun typecheck # tsc
```

### Test runner

```bash
bun run test  # Vitest (NEVER `bun test` — that's Bun's built-in runner)
```

### Build

- **turbo** orchestrates cross-package builds
- **tsdown** compiles TypeScript to ESM+CJS+DTS
- **Vite** bundles the web app

---

## 16. General Programming Principles

These are the meta-rules observable across 1,000+ commits. They're not specific to this stack — they're Julius's approach to software.

### 1. Tests are not optional — they're the proof

Every production change ships with tests. A 2-line fix gets 50 lines of tests. The test is not an afterthought — it's the evidence that the change works.

### 2. Extract before it spreads

The moment logic appears in two places, extract it to a shared module. Don't wait for it to be in three places. The `packages/shared` directory exists specifically for this.

### 3. Guard clauses over deep nesting

Compose predicates with `&&` and return early. Don't nest 4 levels of `if` statements.

### 4. Defensive naming

Function names should make impossible states unrepresentable. `isRecoverableThreadResumeError` tells you exactly what it checks. `ensureThreadRegistered` tells you it's idempotent.

### 5. Immutability by default

`readonly` on everything. Spread for updates. New objects, not mutations. The only exception is performance-critical paths where mutation is measured and justified.

### 6. Schema at the boundary, types inside

Effect Schema validates at serialization boundaries (WebSocket, database, file I/O). Inside the application, you work with the inferred TypeScript types. Don't re-validate data you already trust.

### 7. Small, focused units

Each module has one clear purpose, communicates through well-defined interfaces, and can be understood independently. If you can't explain what a file does in one sentence, it's doing too much.

### 8. Correctness vocabulary

The commit log is a maintenance manual. Use precise verbs:
- **Harden** = make more robust against edge cases
- **Stabilize** = fix flaky/unreliable behavior
- **Backfill** = add missing data/behavior retroactively
- **Coalesce** = merge redundant operations
- **Warm** = pre-populate caches/subscriptions
- **Guard** = add defensive checks

### 9. Co-author with AI, but own the result

Julius regularly co-authors with Cursor Agent, Codex, and Claude. The AI generates — the human validates. AI contributions go through the same review and testing standards as human code.

### 10. Prefer deletion over deprecation

When replacing a library or pattern (e.g., `@tanstack/react-virtual` → `@legendapp/list`), delete the old code entirely. Don't deprecate it, don't leave compatibility shims. Clean cut.

### 11. Configuration is code

No `.env` files in the repo. All config through CLI flags (parsed with Effect's CLI module) or environment variables (parsed with Effect's `Config` module). Typed, validated, documented.

### 12. The async completion pattern

For operations that span multiple steps (checkpointing, turn lifecycle):
1. Enqueue work via queue-backed workers
2. Emit typed receipts when milestones complete
3. Tests and orchestration wait on receipts — never poll internal state
4. `DrainableWorker.drain()` provides deterministic test synchronization

---

## Appendix: The Stack at a Glance

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Bun 1.3.9 | Startup speed, native TS, built-in SQLite |
| Package manager | Bun workspaces | Catalogs for version pinning |
| Build orchestration | Turborepo | Topological task ordering |
| Type system | Effect Schema | Single source of truth for types + runtime validation |
| Server framework | Effect (Layer/Service/Stream) | Compile-time DI, structured concurrency, resource safety |
| RPC | Effect RPC over WebSocket | Type-safe bidirectional, schema-validated |
| Database | SQLite via @effect/sql-sqlite-bun | Embedded, zero-config, fast |
| CLI | effect/unstable/cli | Typed flags/args with Effect integration |
| Frontend framework | React 19 + React Compiler | Automatic memoization |
| Routing | TanStack Router | File-based, type-safe |
| State | Zustand + @effect/atom-react | Imperative stores + reactive Effect bridges |
| Styling | Tailwind CSS v4 + CVA | Utility-first with variant composition |
| Editor | Lexical | Extensible rich text |
| Terminal | xterm | Full PTY emulation |
| Linter | oxlint | Rust speed, ESLint-compatible rules |
| Formatter | oxfmt | Rust speed |
| Tests | Vitest 4 + @effect/vitest + Playwright | Unit, integration, browser |
| Desktop | Electron 40 | Cross-platform native wrapper |
