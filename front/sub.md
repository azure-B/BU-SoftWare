# front/ — React (this project only)

Parent context: [../AGENTS.md](../AGENTS.md). Rules: `.cursor/rules/01-react-frontend.mdc`, `04-css-architecture.mdc`.

> **Maintenance:** This file is manual. It does not auto-update when you edit code. Ask the agent to refresh it after folder or convention changes, or update it yourself.

## Commands

```bash
cd front
npm install
npm start    # http://localhost:3000
npm test
npm run build
```

## Directory layout (CRA + Tailwind v3)

```
front/
├── tailwind.config.js      # theme tokens from Publish export
├── postcss.config.js       # tailwindcss + autoprefixer (CRA-compatible)
├── public/
│   ├── index.html          # fonts, title
│   └── publish/            # source HTML exports (reference only)
│       ├── login.html
│       └── regi.html
└── src/
    ├── index.js            # common.css + layout.css
    ├── App.js              # view routing (login / dashboard / …)
    ├── components/
    │   ├── constants.js    # logo, nav, footer links
    │   └── layout/
    │       ├── AppHeader.jsx
    │       ├── AppFooter.jsx   # variant: login | app
    │       ├── AppShell.jsx    # header + children + footer (app pages)
    │       └── BackgroundWatermark.jsx
    ├── components/reservation/
    │   ├── FacilitySidebar.jsx
    │   ├── FacilityCard.jsx
    │   ├── ReservationView.jsx
    │   └── reservationData.js
    ├── components/community/
    │   ├── CommunitySidebar.jsx
    │   ├── CommunityPostList.jsx
    │   ├── communityData.js
    │   └── postData.js
    ├── components/tour/
    │   ├── TourSidebar.jsx
    │   └── tourData.js
    ├── components/mypage/
    │   └── …
    ├── jsx/
    │   ├── Login.jsx
    │   ├── Regi.jsx           # 회원가입 (login ↔ regi)
    │   ├── Dashboard.jsx
    │   ├── Reservation.jsx
    │   ├── ReservationBooking.jsx   # 시설 예약 신청 (reservation_in.html)
    │   ├── MyReservations.jsx     # 내 예약 조회
    │   ├── Community.jsx      # nav: square (학생광장)
    │   ├── Post.jsx           # nav: square (게시글 상세)
    │   ├── NewPost.jsx        # nav: square (글쓰기)
    │   ├── Tour.jsx           # nav: dept (캠퍼스 투어)
    │   └── MyPage.jsx
    └── public/css/
        ├── …
        ├── community.css
        ├── post.css
        ├── new_post.css
        └── tour.css
```

## Conventions

- **Layout**: `AppHeader` / `AppFooter` / `AppShell` in `components/layout/` — pages must not copy header/footer markup
- **Login / Regi**: no header (Publish spec); `AppFooter variant="login"`; `App.js` view `login` ↔ `regi`
- **App pages** (Dashboard, Reservation, …): wrap with `AppShell`, pass `activeNav` + `onNavSelect`
- **Nav map**: `square` → Community, `dept` → Tour, `reservation`, `dashboard`, profile icon → MyPage
- New Publish pages → `jsx/<Page>.jsx` + `public/css/<page>.css`; shared tokens in `constants.js`
- `index.js` imports `common.css` + `layout.css`
- API: `http://localhost:3000` in dev (`REACT_APP_API_URL` when added)

## Publish migration

**Full guide:** [docs/publish-to-jsx.md](docs/publish-to-jsx.md) ← 새 채팅에서도 이 문서 기준

1. Source: `public/publish/<page>.html`
2. Split embedded `<style>` → `common.css` + `<page>.css`
3. JSX → `src/jsx/<Page>.jsx` + reusable `components/<domain>/`
4. Wire `App.js` + update this file

Skill: `@html-publish-to-react` · Rule: `.cursor/rules/07-publish-to-jsx.mdc`

## Do not

- Put app CSS in CRA `public/` (that folder is static assets only)
- Duplicate theme colors outside `tailwind.config.js` unless necessary
- Commit API secrets in frontend code
