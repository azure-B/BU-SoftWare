---
name: html-publish-to-react
description: Convert Publish or static HTML in front/public/publish/ to React JSX with common.css and per-page CSS. Use when user says publish, HTML to JSX, or @front/public/publish/*.html conversion.
---

# HTML (Publish) → React

**Read first:** [front/docs/publish-to-jsx.md](../../front/docs/publish-to-jsx.md)  
**Project layout:** [front/sub.md](../../front/sub.md)

## When to use

- User references `front/public/publish/*.html`
- User asks: Publish, HTML → JSX, common.css split, new page migration

## Required outputs

```
front/src/jsx/<Page>.jsx
front/src/public/css/<page>.css        # import in JSX
front/src/public/css/common.css        # only if new shared rules; import in index.js
front/src/components/<domain>/         # if repeated blocks (Card, Sidebar, Table)
front/src/App.js                       # view + handleNavSelect
front/sub.md                           # update nav map
```

## Workflow (summary)

1. Inventory HTML sections; identify header/footer → use **AppShell**, not copy markup
2. Split `<style>`: common vs page (see doc §5)
3. Merge tailwind-config script into `tailwind.config.js` if new tokens
4. Convert body to JSX (`className`, self-closing tags, handlers)
5. Extract components + `*Data.js` for lists/tables
6. Wire `App.js` (view id + `activeNav` from `constants.js` NAV_ITEMS)
7. Run `npm run build`

## Layout

- **Login:** no header; `AppFooter variant="login"`
- **App pages:** `AppShell` + `footerVariant="app"` + `activeNav`

## Do not

- Duplicate AppHeader/AppFooter HTML in page files
- Put bundled CSS in CRA `public/` (only static assets there)
- Skip `App.js` or `sub.md` updates
