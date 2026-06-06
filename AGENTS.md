# software — Agent context (React + Node.js)

Cursor reads this file first. **Project-specific detail lives in `sub.md` per app** — do not duplicate long structure here.

## Stack

| Area | Path | Runtime | Notes |
|------|------|---------|--------|
| Frontend | `front/` | React 19, CRA (`react-scripts`) | Dev: `npm start` → port 3000 |
| Backend | `server/` | Express, Node | Dev: `npm run dev` / `npm start` → `PORT` (default 3000) |

## Where to read next

| Working in | Read |
|------------|------|
| `front/**` | [front/sub.md](front/sub.md) |
| `server/**` | [server/sub.md](server/sub.md) |
| Publish HTML → React | [front/docs/publish-to-jsx.md](front/docs/publish-to-jsx.md) · `@html-publish-to-react` skill |

## Ignore files

- [.cursorignore](.cursorignore) — AI must not read `node_modules`, build output, `.env`, `picture/`, binaries
- [.cursorindexingignore](.cursorindexingignore) — same paths excluded from codebase search index

After editing ignore files: **Ctrl+Shift+P** → `Reindex Codebase` (or Reset Index).

## Cross-cutting (always)

- **API base**: `http://localhost:${PORT}` — routes under `/api/users`, `/api/posts`, `/api/counter`
- **Legacy static UI** (migrating away): `server` may still serve old HTML under `/front/pages/`; new UI lives in CRA `front/src/`
- **Env**: copy `server/.env.example` → `server/.env`; never commit secrets
- **Tests**: `cd server && npm test` before claiming backend work is done
- **Scope**: minimal diffs; no drive-by refactors; commit only when asked

## CSS policy (frontend)

- Tailwind v3 via `front/postcss.config.js` + `front/tailwind.config.js` (CRA-compatible)
- Shared → `front/src/public/css/common.css` (import in `index.js`)
- Page-only → `front/src/public/css/<page>.css` (import in `src/jsx/<Page>.jsx`)
- Screens → `front/src/jsx/`; `App.js` mounts the active page
