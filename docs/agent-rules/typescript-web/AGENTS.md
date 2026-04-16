# AGENTS.md — Universal + TypeScript/Web Rules

Extracted from the T3 Code codebase (~1,000 commits by Julius Marminge). Tier 1 rules are language-agnostic. Tier 2 rules apply to any TypeScript web project — Next.js, React, Shopify Hydrogen, internal tools, etc.

---

## Tier 1: Universal Engineering Rules

### Core Priorities (in order)

1. **Correctness** — the system does what it claims under all conditions.
2. **Reliability** — predictable behavior under load, failure, and edge cases.
3. **Performance** — fast, but never at the cost of correctness.
4. **Maintainability** — long-term clarity over short-term convenience.

If a tradeoff is required, choose robustness over convenience.

### Code Quality

- No dead code. No commented-out code. No `TODO`/`FIXME` comments left behind.
- No shortcuts — if solving a problem reveals shared logic, extract it immediately.
- No gratuitous abstraction. Every layer must carry its weight.
- Each file has one clear purpose. If you can't explain it in one sentence, it's doing too much.
- Guard clauses over deep nesting. Flat code is readable code.
- Immutability by default. New objects, not mutations.
- Prefer deletion over deprecation. When replacing something, remove the old code entirely.

### Testing

- Every production change ships with tests.
- Co-locate tests with source: `Foo.test.ts` next to `Foo.ts`.
- Test edge cases and error paths, not just the happy path.
- Harness factories over copy-paste test setup.

### Commits & PRs

- Sentence-case, imperative mood, verb-first commit messages.
- Small and focused PRs. One concern per PR. Explain the "why."
- Use precise verbs: Harden, Stabilize, Extract, Guard, Coalesce, Backfill.

### Async

- Queue-based work with completion signals over polling.
- Explicit resource lifecycle (acquire → use → release).

### Configuration

- Typed and validated. Catch config bugs at compile/startup time.

### AI Co-authoring

- Same review and testing standards as human code.

---

## Tier 2: TypeScript Rules

### Strict TypeScript — non-negotiable

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true
}
```

These catch real bugs. Turn them on in every project.

### No `any`. Ever.

Use `unknown` with type narrowing. If you find yourself reaching for `any`, the type design needs work.

```typescript
// NO
function parse(input: any): Thing { ... }

// YES
function parse(input: unknown): Thing {
  if (!isValidThing(input)) throw new Error("Invalid input");
  return input as Thing;
}
```

### No `enum`. Use union types.

```typescript
// NO
enum Status { Active, Inactive, Archived }

// YES
type Status = "active" | "inactive" | "archived";
```

Enums generate runtime code, have quirky behavior with reverse mappings, and don't work well with discriminated unions. Literal union types are simpler, safer, and tree-shakeable.

### No default exports. Always named.

```typescript
// NO
export default function MyComponent() { ... }

// YES
export function MyComponent() { ... }
```

Named exports improve refactoring (rename propagates), search (grep finds them), and prevent import-name mismatches.

### `readonly` everywhere

All interface fields, function parameters, and array types use `readonly`:

```typescript
interface CreateUserInput {
  readonly name: string;
  readonly email: string;
  readonly tags: ReadonlyArray<string>;
}
```

### Branded types for entity IDs

Prevent mixing up IDs that are all `string` at runtime:

```typescript
// With Zod
const UserId = z.string().brand<"UserId">();
type UserId = z.infer<typeof UserId>;

// Plain TypeScript
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

// Now this is a type error:
function getUser(id: UserId): User { ... }
getUser(orderId); // ❌ Type error
```

### `as const` for object literals and tuples

```typescript
const METHODS = {
  getUser: "user.get",
  listUsers: "user.list",
} as const;

const pair = [key, value] as const;
```

### `satisfies` for implementation validation

```typescript
const config = {
  port: 3000,
  host: "localhost",
} satisfies ServerConfig;
```

Validates the shape without widening the type.

### Underscore prefix for unused destructured values

```typescript
const { password: _password, ...safeUser } = user;
const { [removedId]: _removed, ...remaining } = recordById;
```

### Numeric literals with underscores

```typescript
const TIMEOUT_MS = 4_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOKENS = 128_000;
```

---

## Tier 2: Import Organization

### 4-group order, separated by blank lines

```typescript
// 1. Node/runtime builtins
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 2. External packages
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

// 3. Workspace/monorepo packages
import { UserSchema } from "@myapp/contracts";
import { formatDate } from "@myapp/shared/dates";

// 4. Relative imports
import { UserCard } from "./UserCard";
import type { PageProps } from "../types";
```

Enforce with ESLint `import/order`, Biome, or your linter of choice.

---

## Tier 2: Naming Conventions

### Semantic function prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `make*` | Factory/constructor | `makeApiClient`, `makeLogger` |
| `build*` | Construct a derived value | `buildQueryParams`, `buildFilterOptions` |
| `read*` | Extract/parse from unknown data | `readSearchParams`, `readCookieValue` |
| `resolve*` | Lookup with fallback | `resolveTheme`, `resolveLocale` |
| `normalize*` | Canonicalize input | `normalizeEmail`, `normalizeSlug` |
| `map*` | Transform domain types | `mapApiResponseToUser`, `mapOrderToLineItems` |
| `to*` | Type coercion/branding | `toUserId`, `toISOString` |
| `is*` | Boolean predicate | `isAuthenticated`, `isExpired` |
| `select*` | Store selector | `selectCurrentUser`, `selectCartTotal` |
| `apply*` | Reduce event/action into state | `applyCartUpdate`, `applyFilter` |
| `ensure*` | Idempotent setup | `ensureAuthenticated`, `ensureDbConnection` |

### Casing

| Thing | Convention | Example |
|-------|-----------|---------|
| Functions / variables | camelCase | `resolveTheme`, `currentUser` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `API_BASE_URL` |
| Types / interfaces | PascalCase | `UserProfile`, `CartState` |
| React components | PascalCase `.tsx` | `UserCard.tsx`, `OrderList.tsx` |
| Hooks | camelCase with `use` | `useAuth.ts`, `useCart.ts` |
| Logic co-files | `.logic.ts` suffix | `OrderList.logic.ts` |
| Test files | `.test.ts` suffix | `OrderList.test.ts`, `cart.test.ts` |

---

## Tier 2: React & State Management

### Props over Context for data flow

Thread callbacks and data through props. Don't create a new React Context for every piece of shared state. Context is for truly global concerns (theme, auth, locale), not one-off data plumbing.

### Pure reducer functions outside stores

Define state transformation functions as pure, exported functions. Test them independently of the store:

```typescript
// cart.logic.ts — pure, testable
export function applyAddItem(state: CartState, item: CartItem): CartState {
  return { ...state, items: [...state.items, item] };
}

// cart.logic.test.ts
it("adds item to cart", () => {
  const result = applyAddItem(emptyCart, newItem);
  expect(result.items).toHaveLength(1);
});

// store.ts — uses the pure function
set((state) => applyAddItem(state, item));
```

### Normalized state shape

Store entities as `Record<Id, Entity>` with a separate `Id[]` for ordering:

```typescript
interface State {
  readonly userIds: ReadonlyArray<UserId>;
  readonly userById: Record<UserId, User>;
}
```

### Structural equality to prevent unnecessary re-renders

Write custom equality checks for complex objects to avoid re-rendering when data hasn't actually changed.

### Logic extraction pattern

Separate pure business logic from React rendering:

```
OrderList.tsx          — React component (rendering + hooks)
OrderList.logic.ts     — Pure functions (sorting, filtering, transformations)
OrderList.logic.test.ts — Tests for the pure logic
OrderList.test.ts      — Component/integration tests
```

---

## Tier 2: Error Handling

### Validate at the boundary

Parse and validate external data (API responses, user input, URL params) at the system boundary. Use Zod, Valibot, ArkType, or your schema library of choice. Once validated, work with trusted types internally.

```typescript
// At the API boundary
const response = UserSchema.parse(await fetch("/api/user").then((r) => r.json()));

// Inside the app — trusted type, no re-validation
function renderProfile(user: User) { ... }
```

### Typed error classes

Use discriminated error types instead of string messages:

```typescript
type AppError =
  | { readonly _tag: "NetworkError"; readonly status: number }
  | { readonly _tag: "ValidationError"; readonly fields: string[] }
  | { readonly _tag: "AuthError"; readonly reason: string };
```

---

## Tier 2: Module Design

### Monorepo shared packages

If you have a monorepo, maintain a shared package for contracts/schemas (types only, no runtime logic) and a shared utilities package with explicit subpath exports:

```json
{
  "exports": {
    "./dates": { "types": "./src/dates.ts", "import": "./src/dates.ts" },
    "./format": { "types": "./src/format.ts", "import": "./src/format.ts" }
  }
}
```

No barrel `index.ts` in the utilities package. Barrel files hide dependency graphs and break tree-shaking.

### Contracts package = schema-only

The shared types/contracts package should contain schemas, types, error definitions, and protocol constants. No runtime logic, no side effects, no I/O. This keeps it fast to compile and safe to import everywhere.

---

## Tier 2: Comments & Documentation

### Sparse and purposeful

Three acceptable patterns:

1. **JSDoc on public interfaces** — what the service does, not how
2. **Block comments on ownership boundaries** — who writes what, concurrency notes
3. **Inline comments on invariants** — things the code can't express but the reader must know

Never write comments that restate what the code already says.
