# AGENTS.md — Universal Engineering Rules

Extracted from the T3 Code codebase (~1,000 commits by Julius Marminge). These rules are language-agnostic and apply to any project — Swift, TypeScript, Python, Liquid, Rust, whatever.

---

## Core Priorities (in order)

1. **Correctness** — the system does what it claims under all conditions.
2. **Reliability** — predictable behavior under load, failure, and edge cases.
3. **Performance** — fast, but never at the cost of correctness.
4. **Maintainability** — long-term clarity over short-term convenience.

If a tradeoff is required, choose robustness over convenience.

---

## Code Quality

### No slop

- No dead code. No commented-out code.
- No `TODO`/`FIXME` comments left behind in committed code.
- No shortcuts that add local logic to "just make it work." If solving a problem reveals shared logic, extract it.
- No gratuitous abstraction. Every layer must carry its weight.

### Extract shared logic the moment it appears in 2 places

Duplicate logic across multiple files is a code smell. Don't wait for it to be in three places. If a utility is needed by more than one module, extract it to a shared location immediately.

### Small, focused units

Each module/file has one clear purpose, communicates through well-defined interfaces, and can be understood independently. If you can't explain what a file does in one sentence, it's doing too much.

### Guard clauses over deep nesting

Compose predicates with `&&` and return early. Don't nest 4 levels of `if` statements. Flat code is readable code.

### Immutability by default

Prefer `readonly`/`let` over mutable state. Create new objects instead of mutating existing ones. The only exception is performance-critical paths where mutation is measured and justified.

### Prefer deletion over deprecation

When replacing a library, pattern, or approach — delete the old code entirely. Don't deprecate it, don't leave compatibility shims. Clean cuts prevent cruft accumulation.

### Defensive naming

Function names should describe exactly what they do and make impossible states obvious:
- `isRecoverableError` — boolean predicate, clearly named
- `ensureDirectoryExists` — idempotent, tells you it's safe to call twice
- `buildMessageSlice` — constructs a new value, doesn't mutate
- `resolveModelWithFallback` — lookup with fallback logic, not a simple getter

---

## Testing

### Every production change ships with tests

Even a 2-line fix gets tests covering the changed behavior. Tests are not an afterthought — they are the proof that the change works.

### Test what matters

- Test behavior, not implementation details.
- Test edge cases and error paths, not just the happy path.
- Test performance characteristics when relevant (referential stability, cache invalidation, unnecessary recomputation).
- Harness factories over copy-paste test setup for complex scenarios.

### Co-locate tests with source

`Foo.test.ts` lives next to `Foo.ts` (or `FooTests.swift` next to `Foo.swift`, etc.). Tests belong near the code they exercise, not in a separate test tree.

---

## Commit & PR Discipline

### Commit message style

- **Sentence-case, imperative mood, verb-first.**
  - ✅ `Stabilize auth session cookies on reconnect`
  - ✅ `Prevent branch names from regressing to temp worktree names`
  - ✅ `Extract shared utility to common module`
  - ❌ `fixed the thing`
  - ❌ `misc updates`
- Single-line summaries. The diff explains the details.

### Correctness vocabulary

Use precise verbs that communicate intent:
- **Harden** — make more robust against edge cases
- **Stabilize** — fix flaky or unreliable behavior
- **Backfill** — add missing data or behavior retroactively
- **Coalesce** — merge redundant operations
- **Warm** — pre-populate caches or subscriptions
- **Guard** — add defensive checks
- **Extract** — pull shared logic into its own module
- **Preserve** — maintain existing behavior through a change

### PR expectations

- **Small and focused.** One concern per PR.
- **Explain what changed AND why it should exist.** Don't make reviewers guess.
- **Don't mix unrelated fixes.** Each PR earns its own review.
- UI changes require before/after screenshots. Interaction changes require video.

---

## Async & Concurrency

### Queue-based async work with completion signals

For operations that span multiple steps:
1. Enqueue work through ordered workers/queues.
2. Emit typed signals when milestones complete.
3. Wait on signals — never poll internal state.

This pattern applies whether you're using GCD in Swift, Effect streams in TypeScript, channels in Go, or async/await anywhere.

### Resource lifecycle

Acquire resources explicitly, use them in a scoped context, and release them deterministically — not through garbage collection or hope. Connections, file handles, child processes, and sessions all need explicit lifecycle management.

---

## Configuration

### Configuration is code

All configuration should be typed and validated. Prefer CLI flags, typed config objects, or validated environment variables over untyped `.env` files. Catch configuration bugs at compile/startup time, not at runtime in production.

---

## Working with AI

### Co-author with AI, but own the result

AI-generated code goes through the same review and testing standards as human code. The AI generates — the human validates. If you can't explain what a piece of code does, don't ship it.

---

## Module & Architecture Design

### Validate at the boundary, trust inside

Parse and validate data at system boundaries (API responses, user input, file I/O, deserialization). Once data is validated, work with the trusted types internally. Don't re-validate data you already trust.

### Separate interface from implementation

Define what a service does (interface/protocol) separately from how it does it (implementation). This enables testing with mocks and swapping implementations without changing consumers.

### Dependencies flow inward

High-level modules should not depend on low-level details. Both should depend on abstractions. Shared contracts/types live in a dedicated location consumed by all layers.
