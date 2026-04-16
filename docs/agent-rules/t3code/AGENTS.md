# AGENTS.md — T3 Code Repository Rules

Full ruleset for contributing to the T3 Code repository. Includes universal principles, TypeScript/web conventions, and T3 Code-specific patterns (Effect-TS, orchestration, provider architecture).

---

## Task Completion Requirements

- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- NEVER run `bun test`. Always use `bun run test` (runs Vitest).

---

## Core Priorities (in order)

1. **Correctness** — the system does what it claims under all conditions.
2. **Reliability** — predictable behavior under load, failure, reconnect, partial streams.
3. **Performance** — fast, but never at the cost of correctness.
4. **Maintainability** — long-term clarity over short-term convenience.

If a tradeoff is required, choose correctness and robustness over short-term convenience.

---

## Project Snapshot

T3 Code is a minimal web GUI for using coding agents like Codex and Claude. This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

---

## Package Roles

| Package | Purpose | Export style |
|---------|---------|-------------|
| `apps/server` | Node.js WebSocket server. Wraps Codex app-server (JSON-RPC over stdio), serves the React web app, manages provider sessions. | Internal |
| `apps/web` | React/Vite UI. Session UX, conversation/event rendering, client-side state. Connects to server via WebSocket. | Internal |
| `packages/contracts` | Shared Effect/Schema schemas and TypeScript contracts for provider events, WebSocket protocol, model/session types. **Schema-only — no runtime logic.** | Barrel index (`export *`) |
| `packages/shared` | Shared runtime utilities consumed by both server and web. **Explicit subpath exports** (e.g. `@t3tools/shared/git`) — **no barrel index**. | Subpath exports |

---

## Code Quality

### No slop

- No dead code. No commented-out code. No `TODO`/`FIXME` comments.
- No shortcuts — if solving a problem reveals shared logic, extract it.
- No gratuitous abstraction. Every layer must carry its weight.
- Each file has one clear purpose. If you can't explain it in one sentence, split it.
- Guard clauses over deep nesting. Flat code is readable code.
- Prefer deletion over deprecation. When replacing something, remove the old code.

### Maintainability

Long-term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

---

## TypeScript Rules

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

### Hard rules

- **No `any`** — use `unknown` with type narrowing.
- **No `enum`** — use `Schema.Literals([...])` for discriminated unions.
- **No default exports** — always named exports, every file.
- **`readonly` everywhere** — all interface fields, function parameters, array types.
- **`as const`** for object literals and tuples.
- **`satisfies`** for implementation validation: `return { ... } satisfies ServiceShape`.
- **Underscore prefix** for unused destructured values: `const { removed: _removed, ...rest } = obj`.
- **Numeric underscores** for readability: `4_000`, `10 * 1024 * 1024`.

### Branded entity IDs

All entity references use branded types via Effect Schema:

```typescript
const makeEntityId = <Brand extends string>(brand: Brand) =>
  TrimmedNonEmptyString.pipe(Schema.brand(brand));

export const ThreadId = makeEntityId("ThreadId");
export const TurnId = makeEntityId("TurnId");
```

---

## Effect-TS Patterns

### Version

Effect 4.0.0-beta.45 — this is the programming model for the entire server and contracts layer.

### Service definition

```typescript
// 1. Interface shape (Services/ directory)
export interface MyServiceShape {
  readonly doWork: (input: Input) => Effect.Effect<Output, MyError>;
  readonly stream: Stream.Stream<Event>;
}

// 2. Service tag
export class MyService extends Context.Service<MyService, MyServiceShape>()(
  "t3/myService",
) {}

// 3. Layer implementation (Layers/ directory)
export const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    // ...
    return { ... } satisfies MyServiceShape;
  }),
);
```

### `Effect.fn` for named functions

```typescript
const processItem = Effect.fn("processItem")(
  function* (item: Item): Effect.fn.Return<Result, ProcessError, MyService> {
    const svc = yield* MyService;
    // ...
  },
);
```

### Selective imports

```typescript
// YES
import { Effect, Layer, Option, Queue, Ref, Schema, Stream } from "effect";

// NO — never barrel import
import * as E from "effect";
```

### Layer composition

```typescript
const RuntimeDependenciesLive = ReactorLayerLive.pipe(
  Layer.provideMerge(CheckpointingLayerLive),
  Layer.provideMerge(GitLayerLive),
  Layer.provideMerge(OrchestrationLayerLive),
);
```

### Error types

```typescript
export class MyOperationError extends Schema.TaggedErrorClass<MyOperationError>()(
  "MyOperationError",
  { message: TrimmedNonEmptyString, cause: Schema.optional(Schema.Defect) },
) {}
```

### Error handling idioms

| Pattern | Use when |
|---------|----------|
| `Effect.mapError` | Lift raw errors into domain-specific tagged errors |
| `Effect.catchTag` | Discriminated error matching by `_tag` |
| `Effect.ignoreCause({ log: true })` | Fire-and-forget cleanup |
| `Effect.acquireRelease` | Resource lifecycle (connections, sessions, locks) |
| `Effect.forkScoped` | Background work cancelled when scope closes |
| `Effect.forkDetach` | Fire-and-forget background work |

### Streams

- `Stream.fromPubSub` for event bus consumption
- `Stream.callback` for wrapping imperative event sources
- `Stream.concat(snapshotStream, liveStream)` for replay + live

### RPC definitions

```typescript
export const MyRpc = Rpc.make("method.name", {
  payload: InputSchema,
  success: OutputSchema,
  error: ErrorSchema,
  stream: true, // for streaming RPCs
});
```

### Effect language service enforcement

```json
"diagnosticSeverity": {
  "importFromBarrel": "error",
  "anyUnknownInErrorContext": "warning",
  "instanceOfSchema": "warning"
}
```

---

## Import Organization

### 4-group order, separated by blank lines

```typescript
// 1. Node builtins (prefixed node:)
import { spawn } from "node:child_process";

// 2. External packages
import { Effect, Layer, Schema, Stream } from "effect";

// 3. Workspace packages
import { ThreadId } from "@t3tools/contracts";
import { normalizeModelSlug } from "@t3tools/shared/model";

// 4. Relative imports
import { ProviderService } from "./provider/Layers/ProviderService";
```

---

## Naming Conventions

### Semantic function prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `make*` | Factory/constructor | `makeWsRpcLayer`, `makeDrainableWorker` |
| `build*` | Construct a derived value | `buildCodexInitializeParams` |
| `read*` | Extract/parse from unknown | `readResumeThreadId` |
| `resolve*` | Lookup with fallback | `resolveModelSlug` |
| `normalize*` | Canonicalize input | `normalizeModelSlug` |
| `map*` | Transform domain types | `mapSession`, `mapThread` |
| `to*` | Type coercion/branding | `toTurnId`, `toProviderItemId` |
| `is*` | Boolean predicate | `isRecoverableThreadResumeError` |
| `derive*` | Compute from state | `derivePhase`, `deriveTimelineEntries` |
| `select*` | Zustand store selector | `selectEnvironmentState` |
| `apply*` | Reduce event into state | `applyOrchestrationEvent` |
| `sync*` | Replace state from snapshot | `syncServerShellSnapshot` |
| `write*` | Write to normalized state | `writeThreadState` |
| `ensure*` | Idempotent setup | `ensureThreadRegistered` |

### Casing

| Thing | Convention | Example |
|-------|-----------|---------|
| Functions / variables | camelCase | `resolveSessionCookieName` |
| Constants | SCREAMING_SNAKE | `CAPABILITIES_PROBE_TIMEOUT_MS` |
| Effect Services | PascalCase | `OrchestrationProjectionPipeline` |
| Service files | PascalCase in `Services/` | `OrchestrationEngine.ts` |
| Layer files | PascalCase in `Layers/` | `OrchestrationReactor.ts` |
| Shared utility modules | PascalCase | `Net.ts`, `DrainableWorker.ts` |
| Application code | camelCase | `codexAppServerManager.ts` |
| React components | PascalCase `.tsx` | `ChatView.tsx` |
| React hooks | camelCase with `use` | `useSettings.ts` |
| Logic co-files | `.logic.ts` suffix | `ChatView.logic.ts` |
| Tests | `.test.ts` co-located | `Foo.test.ts` next to `Foo.ts` |
| Browser tests | `.browser.tsx` | `ChatView.browser.tsx` |
| Migrations | Numbered prefix | `024_BackfillProjection.ts` |

---

## Directory Structure

### Server (`apps/server/src/`)

```
domain/
  Services/   — Interface definitions (Context.Service tags)
  Layers/     — Layer implementations
  *.ts        — Shared types, errors, pure logic
```

Domains: `auth/`, `checkpointing/`, `environment/`, `git/`, `observability/`, `orchestration/`, `persistence/`, `project/`, `provider/`, `telemetry/`, `terminal/`, `workspace/`.

### Web (`apps/web/src/`)

```
components/   — React components (PascalCase .tsx)
routes/       — TanStack Router file-based routes
hooks/        — Custom React hooks
lib/          — Utility functions
rpc/          — WebSocket RPC client
observability/ — Client tracing
```

---

## React & Frontend

### Stack

- React 19 + React Compiler (automatic memoization)
- TanStack Router (file-based, type-safe routing)
- TanStack React Query (server state/caching)
- Tailwind CSS v4 + CVA (variant styling)
- Lexical (rich text editor), xterm (terminal), @legendapp/list (virtualized lists)
- @base-ui/react (headless primitives)
- Path alias: `~/*` → `./src/*`

### Rules

- **Props over Context** for data flow. Don't create new Contexts for one-off plumbing.
- **Logic extraction**: `Component.logic.ts` alongside `Component.tsx` for testable pure logic.
- **Structural equality checks** to prevent unnecessary re-renders.
- **Normalized state**: `Record<Id, Entity>` + `Id[]` for ordering.

### State management

| Store | Purpose |
|-------|---------|
| `store.ts` (Zustand) | Main orchestration state |
| `uiStateStore.ts` | Transient UI state |
| `composerDraftStore.ts` | Draft message state |
| `terminalStateStore.ts` | Terminal state |
| `@effect/atom-react` atoms | Reactive Effect stream bridges |

Pure reducer functions defined outside stores, exported for independent testing.

---

## Testing

### Every change gets tests

Even a 2-line fix gets tests. No exceptions.

### Framework

- Vitest 4 + `@effect/vitest` for Effect-aware tests
- `msw` for API mocking in browser tests
- `@vitest/browser-playwright` for browser integration tests

### Patterns

- Co-located: `Foo.test.ts` next to `Foo.ts`
- Browser tests: `Component.browser.tsx`
- Harness factories for complex setup
- Referential stability assertions: `expect(second).toBe(first)`
- No mocking frameworks beyond `vi` — manual spy setup

---

## Orchestration Architecture

The server uses event-sourcing in the orchestration layer:

1. **Commands** → validated by invariants → **Events** (source of truth)
2. **Projector** applies events to read models (materialized views)
3. **Reactors** handle side effects after events (checkpoint capture, provider dispatch)
4. **Receipts** signal async milestones (`checkpoint.captured`, `turn.quiesced`)
5. **DrainableWorker** keeps async work ordered and test-friendly via `drain()`

Key files: `decider.ts`, `projector.ts`, `OrchestrationEngine.ts`, `ProjectionPipeline.ts`, `ProviderCommandReactor.ts`, `CheckpointReactor.ts`, `RuntimeReceiptBus.ts`.

---

## Provider Architecture

- **ProviderService** orchestrates sessions and dispatches to adapters
- **ProviderAdapterRegistry** manages multiple providers behind a uniform interface
- **CodexAdapter** (JSON-RPC over stdio) and **ClaudeAdapter** (@anthropic-ai/claude-agent-sdk)
- **ProviderRuntimeIngestion** normalizes provider events into orchestration commands
- Runtime events → orchestration events → WebSocket push → browser state

---

## Codex App Server

T3 Code is currently Codex-first. The server starts `codex app-server` per provider session, then streams structured events through WebSocket push messages.

- Session lifecycle: `codexAppServerManager.ts`
- WebSocket routing: `ws.ts`
- Web consumption: `orchestration.domainEvent` channel

Docs: https://developers.openai.com/codex/sdk/#app-server

Reference repos:
- https://github.com/openai/codex
- https://github.com/Dimillian/CodexMonitor

---

## Comments & Documentation

### Three acceptable patterns

1. **JSDoc on service interfaces** — what it does, not how
2. **Block comments on ownership boundaries** — concurrency notes, stream ownership
3. **Inline comments on invariants** — things code can't express but readers must know

No noise comments. No comments restating code. No commented-out code.

### Architecture docs

- `.docs/architecture.md` — system architecture with sequence diagrams
- `.docs/encyclopedia.md` — domain glossary (read this first)
- `.docs/provider-architecture.md` — provider system overview
- `docs/observability.md` — logging, tracing, debugging
- `docs/effect-fn-checklist.md` — Effect.fn refactoring guide

---

## Tooling

| Tool | Command | Purpose |
|------|---------|---------|
| oxfmt | `bun fmt` | Formatting |
| oxlint | `bun lint` | Linting |
| TypeScript | `bun typecheck` | Type checking |
| Vitest | `bun run test` | Testing (**never** `bun test`) |
| Turborepo | `turbo run build` | Build orchestration |
| tsdown | (via turbo) | TS → ESM+CJS+DTS |
| Bun | Runtime + package manager | Runtime |

### Quality gate

All three must pass before any task is considered complete:

```bash
bun fmt
bun lint
bun typecheck
```

---

## Commit Style

- **Sentence-case, imperative mood, verb-first. No conventional commit prefix.**
  - ✅ `Backfill projected shell summaries and stale approval cleanup`
  - ✅ `Memoize derived thread reads`
  - ✅ `Prevent live thread branches from regressing to temp worktree names`
  - ❌ `feat: add shell summaries`
- Single-line summaries. PR number appended: `(#123)`.
- Use precise verbs: Harden, Stabilize, Extract, Guard, Coalesce, Backfill, Warm.
