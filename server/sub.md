# server/ — Express (this project only)

Parent context: [../AGENTS.md](../AGENTS.md). Rules: `.cursor/rules/02-express-api.mdc`, `03-testing.mdc`.

> **Maintenance:** This file is manual. It does not auto-update when you edit code. Ask the agent to refresh it after folder or convention changes, or update it yourself.

## Commands

```bash
cd server
npm install
cp .env.example .env
npm run dev    # nodemon
npm start
npm test
```

## Directory layout (MVC — keep this shape)

```
server/src/
├── app.js                 # express app, CORS, static, routes, error handlers
├── middlewares/
│   ├── logger.js
│   ├── validate.js        # validate(), validateEmail(), validateNumbers()
│   └── errorHandler.js      # notFound, errorHandler
├── routes/                # *Router.js — mount paths only
├── controllers/           # request/response; call models
└── models/                # data access (in-memory today; DB swap here only)
```

## Database

PostgreSQL 스키마·DDL·프론트 매핑: [DB_SCHEMA.md](DB_SCHEMA.md)

- **Supabase**: `src/config/supabase.js` — `@supabase/supabase-js` (서버는 `SUPABASE_SERVICE_ROLE_KEY` 권장)
- RLS 정책: `scripts/supabase-rls.sql`
- 로컬 시드: `scripts/seed-auth.sql` (학번 `20240001` / 비밀번호 `password123`)

## Security (입력 전처리)

- `middlewares/sanitizeAuth.js` + `utils/sanitize.js` — 로그인 body 정규화·형식 검증
- DB 쿼리: Supabase `.eq()` / pg `$1` 바인딩만 사용 (문자열 concat SQL 금지)
- publishable 키는 `.env`에만, 커밋 금지

## Routing map

| Prefix | Router file |
|--------|-------------|
| `/` | `homeRouter.js` |
| `/api/auth` | `authRouter.js` |
| `/api/auth/register` | `registerRouter.js` |
| `/api/users` | `userRouter.js` |
| `/api/posts` | `postRouter.js` |
| `/api/community` | `communityRouter.js` |
| `/api/counter` | `counterRouter.js` |

## API docs (Swagger)

- UI: `http://localhost:5000/api-docs` (또는 `.env`의 `PORT`)
- Spec 생성: `src/config/swagger.js` + route JSDoc 주석

## Patterns to follow

- New endpoints: add route → controller method → model method; do not skip layers
- Validation on POST/PATCH: `validate(...)` + `validateEmail()` / `validateNumbers()` from `validate.js`
- Errors: `next(err)` or throw; handled by `errorHandler.js`
- JSON body: `express.json()` already in `app.js`
- Static legacy front: `app.use('/front', ...)` — prefer moving UI to CRA `front/` over extending static HTML

## API error shape

Use consistent JSON: `{ error: string }` (match existing handlers in `errorHandler.js`).

## Do not

- Put business logic in routers
- Change controller signatures when only swapping in-memory → DB in models
- Log passwords, tokens, or full sensitive bodies
- Commit `.env`
