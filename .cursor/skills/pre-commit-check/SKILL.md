---
name: pre-commit-check
description: >-
  Runs the same lint, test, and build steps as GitHub CI before git commit or PR.
  Use when the user asks to prepare for commit, pre-commit check, verify before push,
  or fix CI lint failures locally.
---

# Pre-commit check (pdf-editor)

Mirror [.github/workflows/ci.yml](.github/workflows/ci.yml) locally **before** staging or committing. CI does not run on every branch name—run these checks manually when working on feature branches.

## Required commands (run from repo root)

Execute in order; stop and fix on first failure.

```bash
cd backend && npm install && npm run lint && npm test
cd ../frontend && npm install && npm run lint && npm run build && npm test
```

One-liner from repo root:

```bash
(cd backend && npm run lint && npm test) && (cd frontend && npm run lint && npm run build && npm test)
```

## What CI catches that is easy to miss locally

| Issue | Where | Rule / check |
|-------|--------|----------------|
| Single-line `if` without braces | `backend/**/*.js` | ESLint `curly` (error) |
| React refresh / hook export warnings | `frontend` | ESLint `max-warnings 0` |
| Broken production bundle | `frontend` | `npm run build` |
| API regressions | `backend` | `node --test server.test.js` |

**Backend `curly`:** always use block bodies:

```js
// bad — fails backend lint
if (condition) return value;

// good
if (condition) {
  return value;
}
```

Frontend may allow one-line `if` in JSX/handlers; **backend does not**. When editing `backend/config/limits.js` or similar parsers, use braces even for early returns.

## Agent workflow before commit

1. Run the command block above (readonly diagnosis if install already done: skip `npm install` when `node_modules` exists).
2. If lint fails with `curly`, run `cd backend && npm run lint:fix` then re-run lint.
3. Summarize: pass/fail per package, files changed for fixes.
4. Only then `git add` / `git commit` when the user explicitly asked to commit.

## Optional (not in CI, useful locally)

- `cd backend && npm run format` / `cd frontend && npm run format` — Prettier, if team uses it before commit.

## Do not

- Commit with failing `npm run lint` in backend or frontend.
- Assume frontend-only lint is enough; backend has stricter `curly` rules.
- Skip `npm run build` on frontend-only changes that touch imports or Vite config.
