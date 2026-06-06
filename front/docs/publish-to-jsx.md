# Publish HTML → JSX 변환 가이드 (이 프로젝트 전용)

> **새 Cursor 채팅에서도 이 문서를 기준으로 변환합니다.**  
> Skill: `@html-publish-to-react` · Rule: `.cursor/rules/07-publish-to-jsx.mdc`

## 1. 입력 / 출력

| 항목 | 경로 |
|------|------|
| **원본 (참고용, 수정 X)** | `front/public/publish/<name>.html` |
| **페이지 JSX** | `front/src/jsx/<Page>.jsx` |
| **페이지 CSS** | `front/src/public/css/<page>.css` |
| **공통 CSS** | `front/src/public/css/common.css` ( `index.js`에서 1회 import ) |
| **레이아웃 CSS** | `front/src/public/css/layout.css` (header/footer variant) |
| **Tailwind 토큰** | `front/tailwind.config.js` (Publish `<script id="tailwind-config">` 내용 이관) |
| **라우팅** | `front/src/App.js` (`view` state) |

## 2. 변환 체크리스트 (순서 고정)

1. `public/publish/<page>.html` 읽기
2. `<style>` 블록 분리
   - `/* --- common.css --- */` → `common.css` 또는 `layout.css` (이미 있으면 병합)
   - `/* --- <page>.css --- */` → `<page>.css`
3. `<script id="tailwind-config">` → `tailwind.config.js` `theme.extend` (중복 color/font만 추가)
4. **Header/Footer** → 이미 있으면 **복사하지 말고** `AppShell` / `AppFooter` 재사용
5. **페이지 본문만** JSX로 변환
6. 반복 UI → `front/src/components/<domain>/` 로 추출 (예: `FacilityCard`, `CommunityPostList`)
7. 정적 데이터 → `*Data.js` (예: `communityData.js`, `tourData.js`)
8. `App.js`에 `view` + `handleNavSelect` 연동
9. `front/sub.md`에 페이지·nav 매핑 한 줄 추가 (수동 유지)

## 3. 레이아웃 규칙

| Publish 화면 | Header | Footer | 래퍼 |
|--------------|--------|--------|------|
| Login | **없음** | `AppFooter variant="login"` | 직접 `<div className="login-page">` |
| 그 외 앱 페이지 | `AppHeader` | `AppFooter variant="app"` | `<AppShell>` |

`AppShell` props: `activeNav`, `onNavSelect`, `onLogout`, `onProfileClick`, `profileActive`, `showWatermark`(Dashboard만)

### Nav 매핑 (`constants.js` → `App.js`)

| `NAV_ITEMS.id` | JSX | Publish 원본 |
|----------------|-----|--------------|
| `dashboard` | `Dashboard.jsx` | Dashboard.html |
| `square` | `Community.jsx` | community.html |
| `dept` | `Tour.jsx` | tour.html |
| `reservation` | `Reservation.jsx` | reservation.html |
| (프로필 아이콘) | `MyPage.jsx` | mypage.html |

## 4. HTML → JSX 규칙

- `class` → `className`
- `for` → `htmlFor`
- void tag self-close: `<img />`, `<input />`, `<br />`
- 인라인 `onclick` → `useEffect` / handler (Login 카드 tilt 등)
- `<a href="#">` 네비게이션이 아니면 `<button type="button">`
- Publish CDN Tailwind script **제거** — 빌드 Tailwind v3 + `common.css` `@tailwind` 사용

## 5. CSS 분리 기준

| `common.css` / `layout.css` | `<page>.css` |
|-----------------------------|--------------|
| `:root`, body, material icons | 페이지 전용 grid/layout |
| `.gold-divider`, `.header-shared` | `.facility-card`, `.community-post` |
| footer variant (login/app) | sidebar, table, card 페이지 전용 |

**규칙:** 2개 이상 페이지에서 동일 선언 → `common.css`로 승격.

## 6. 컴포넌트 추출 기준

- **layout/** — Header, Footer, Shell (전 페이지 공통)
- **components/<domain>/** — 한 페이지·한 도메인 UI (Sidebar, Card, Table)
- **jsx/** — 페이지 조립만 (Shell + main content)

파일명: PascalCase JSX, kebab-case CSS (`login.css`, `dashboard.css`).

## 7. App.js 연동 템플릿

```js
// 1) import
import NewPage from './jsx/NewPage';

// 2) handleNavSelect routes 배열에 nav id 추가
const routes = ['dashboard', 'square', 'dept', 'reservation', 'newview'];

// 3) view 분기
if (view === 'newview') {
  return <NewPage {...sharedAppProps} activeNav="newnav" />;
}
```

Login만 `onLogin` → `setView('dashboard')`.

## 8. 완료 기준

- [ ] `npm run build` 성공
- [ ] Header/Footer 마크업 페이지 JSX에 **중복 없음**
- [ ] `common.css`는 `index.js`에서만 import
- [ ] 페이지 CSS는 해당 JSX에서 import
- [ ] `sub.md` nav/폴더 구조 갱신
- [ ] eslint unused import 없음

## 9. 완료된 페이지 (참고)

| HTML | JSX | CSS | components |
|------|-----|-----|------------|
| login.html | Login.jsx | login.css | — |
| Dashboard.html | Dashboard.jsx | dashboard.css | layout |
| reservation.html | Reservation.jsx | reservation.css | reservation/* |
| mypage.html | MyPage.jsx | mypage.css | mypage/* |
| community.html | Community.jsx | community.css | community/* |
| post.html | Post.jsx | post.css | community/* (sidebar reuse) |
| tour.html | Tour.jsx | tour.css | tour/* |

## 10. 새 페이지 프롬프트 예시

```
@front/public/publish/foo.html JSX 변환해줘.
가이드: front/docs/publish-to-jsx.md
@html-publish-to-react
nav id: foo → App.js 연동
```
