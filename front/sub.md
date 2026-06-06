# front/ — React (this project only)

Parent context: [../AGENTS.md](../AGENTS.md). Rules: `.cursor/rules/01-react-frontend.mdc`, `04-css-architecture.mdc`, `08-mobile-css-pc-safety.mdc`.

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
    │   ├── chat/
    │   │   └── FaqChatbot.jsx   # 학과 사무실·셔틀 FAQ (플로팅)
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
    │   ├── QuickLinksDock.jsx   # 학과광장 바로가기 (플로팅 아이콘)
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
    │   ├── Find.jsx           # 계정 찾기 (login ↔ find)
    │   ├── FreshmanGuide.jsx  # 신입생 가이드 (login → freshman_guide)
    │   ├── Shuttle.jsx        # 셔틀버스 (freshman_guide → shuttle)
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
        ├── tour.css
        └── faq-chatbot.css
```

## Conventions

- **Layout**: `AppHeader` / `AppFooter` / `AppShell` in `components/layout/` — pages must not copy header/footer markup
- **Login / Regi / Find / FreshmanGuide**: no app header; `AppFooter variant="login"`; auth views in `App.js`
- **App pages** (Dashboard, Reservation, …): wrap with `AppShell`, pass `activeNav` + `onNavSelect`
- **Nav map**: `square` → Community, `dept` → Tour, `reservation`, `shuttle`, `dashboard`, profile icon → MyPage
- New Publish pages → `jsx/<Page>.jsx` + `public/css/<page>.css`; shared tokens in `constants.js`
- `index.js` imports `common.css` + `layout.css`
- API: `http://localhost:3000` in dev (`REACT_APP_API_URL` when added)
- Mobile-only work must stay in `public/css/mobile/*.css`, `mobile-common.css`, or `@media (max-width: 767px)` and must not alter PC layout/markup unless explicitly requested.
- **Do not touch mobile** (`mobile/*.css`, mobile-only components, mobile media queries) unless the user explicitly asks for mobile changes.

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
- Change desktop/PC CSS or JSX structure while doing a mobile-only task. Use `md:hidden`, viewport-conditional rendering, or `md:contents` for mobile-only tags.
- Edit mobile CSS/JSX while doing a PC-only task unless the user explicitly requests mobile changes.
- **Implement work the user did not ask for** in the current message (extra refactors, animation changes, mobile tweaks, docs/rules). Mention optional follow-ups; wait for approval.
