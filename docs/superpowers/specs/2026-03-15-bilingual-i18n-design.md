# Bilingual (EN/ZH) i18n Design — SipSpot

**Date:** 2026-03-15
**Scope:** Homepage + CafeListPage (first phase); architecture extensible to all pages

---

## Goal

Add English/Chinese language switching to SipSpot's Homepage and CafeListPage, with a footer-based language selector, using react-i18next. The architecture must be extensible for additional languages without structural changes.

---

## Architecture

### Library

- **react-i18next** + **i18next** installed in `frontend/`
- No other i18n dependencies

### Translation File Structure

```
frontend/src/locales/
├── en/
│   ├── common.json     ← navbar, footer, shared buttons/labels
│   ├── home.json       ← all Homepage static copy
│   └── cafeList.json   ← all CafeListPage static copy
└── zh/
    ├── common.json
    ├── home.json
    └── cafeList.json
```

Each namespace is a flat or lightly nested JSON object. Keys are semantic (e.g. `"hero.tagline"`, `"featured.title"`).

### i18n Init

- **File**: `frontend/src/i18n.ts`
- Reads saved language from `localStorage` key `sipspot_lang`, defaults to `'en'`
- Registers all three namespaces (`common`, `home`, `cafeList`)
- Imported once in `frontend/src/main.jsx` before the React tree renders

### Language Persistence

- On language change: `i18n.changeLanguage(lang)` + `localStorage.setItem('sipspot_lang', lang)`
- On app init: i18next reads `sipspot_lang` from localStorage
- No page reload required — all `useTranslation` consumers re-render automatically

---

## Language Selector Component

**File**: `frontend/src/components/LangSelect.jsx`

- Native `<select>` element
- Placed in the **footer bottom bar**, between the copyright line and the "Made with ☕" tagline
- Options array (extensible):
  ```js
  const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ];
  ```
- Styled to match the footer: `text-stone-400`, dark background, amber hover
- On change handler calls `i18n.changeLanguage(val)` and saves to localStorage

---

## Translation Scope

### `common.json` (shared)

| Key group | Examples |
|---|---|
| `nav.*` | Discover, Top Rated, Near Me, AI Search, Add a Café |
| `auth.*` | Sign In, Join Free, Sign Out, Profile, My Cafes, My Favorites, My Reviews |
| `footer.*` | Section headings, all footer links, copyright, tagline |
| `shared.*` | View all, Load more, Back, Search, Filter, Clear, Cancel, Submit |

### `home.json` (Homepage)

| Key group | Examples |
|---|---|
| `hero.*` | Tagline, subtitle, search placeholders (name + city), search button |
| `aiSearch.*` | AI search bar placeholder, button label |
| `stats.*` | "Coffee Shops", "Reviews", "Cities Covered" labels |
| `featured.*` | Section label, "Handpicked for You" / "Picked for You", "Featured Coffee Shops" / "Your Personalized Picks", "Personalized" badge, "View all shops", category filter labels |
| `howItWorks.*` | Section heading, all 3 step titles + descriptions |
| `vibes.*` | Section heading, all vibe labels + descriptions |
| `reviews.*` | Section heading, reviewer role labels |
| `newsletter.*` | Heading, body, email placeholder, button, success message |
| `emptyState.*` | "No cafés found in this category yet", "View all cafés" |

### `cafeList.json` (CafeListPage)

| Key group | Examples |
|---|---|
| `header.*` | Page title, subtitle |
| `search.*` | Search placeholder, city placeholder |
| `filters.*` | "Filters", "Rating", "Price", "Amenities", "Vibe", "Sort by", "Clear all", all sort option labels, all price labels (¥ / ¥¥ / ¥¥¥ / ¥¥¥¥), all amenity filter labels |
| `toolbar.*` | Results count ("X cafés found"), view toggle labels (Grid / List) |
| `banner.*` | "Add a Café" banner heading, body, button |
| `empty.*` | Empty state heading, body, retry button |
| `pagination.*` | "Previous", "Next", page indicator |
| `card.*` | Shared cafe card labels (e.g. "reviews", "Open now", distance units) |

### NOT Translated

- Cafe names, addresses, descriptions (user-generated)
- Review text (user-generated)
- Cafe amenity values stored in DB (already Chinese strings — intentional per data model)
- Prices, ratings, review counts (numeric)

---

## Files Changed

### New files
| File | Purpose |
|---|---|
| `frontend/src/i18n.ts` | i18next initialisation |
| `frontend/src/components/LangSelect.jsx` | Language selector `<select>` |
| `frontend/src/locales/en/common.json` | English common strings |
| `frontend/src/locales/en/home.json` | English homepage strings |
| `frontend/src/locales/en/cafeList.json` | English cafe list strings |
| `frontend/src/locales/zh/common.json` | Chinese common strings |
| `frontend/src/locales/zh/home.json` | Chinese homepage strings |
| `frontend/src/locales/zh/cafeList.json` | Chinese cafe list strings |

### Modified files
| File | Change |
|---|---|
| `frontend/package.json` | Add `i18next`, `react-i18next` |
| `frontend/src/main.jsx` | Import `./i18n` |
| `frontend/src/App.jsx` | Add `LangSelect` to footer bottom bar |
| `frontend/src/components/Navbar.jsx` | Replace hardcoded strings with `t()` calls (`common` namespace) |
| `frontend/src/pages/Home.jsx` | Add `useTranslation('home')` |
| `frontend/src/utils/homeData.js` | Extract all displayable strings to `home.json`; keep non-display data (filter functions, IDs) |
| `frontend/src/components/home/*.jsx` (all 14) | Replace hardcoded strings with `t()` calls |
| `frontend/src/pages/CafeListPage.tsx` | Add `useTranslation('cafeList')` |
| `frontend/src/pages/CafeListPage/components/*.tsx` (all sub-components) | Replace hardcoded strings with `t()` calls |

---

## Extensibility

To add a third language (e.g. Japanese):
1. Add `frontend/src/locales/ja/common.json`, `home.json`, `cafeList.json`
2. Add `{ value: 'ja', label: '日本語' }` to `LANGUAGES` array in `LangSelect.jsx`
3. Register the new resources in `i18n.ts`

No structural changes required.

---

## Out of Scope (this phase)

- Other pages (CafeDetailPage, Profile, CreateCafePage, etc.)
- Backend API responses
- Right-to-left (RTL) layout support
- Automatic browser locale detection (deliberately using localStorage only)
