# Bilingual (EN/ZH) i18n Design — SipSpot

**Date:** 2026-03-16
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

Keys are semantic and lightly nested (e.g. `"hero.tagline"`, `"featured.title"`).

### i18n Init

- **File**: `frontend/src/i18n.js` (`.js` — frontend is JSX throughout)
- Reads saved language from `localStorage` key `sipspot_lang`, defaults to `'en'`
- **Default is `'en'`** — intentional. Chinese UI is an added option; users who want it select it manually.
- Resources are **inline bundled** (JSON files imported directly in `i18n.js`; no HTTP plugin; all translations in the JS bundle)
- `fallbackLng: 'en'` — missing zh keys display English string rather than blank
- Registered namespaces: `common`, `home`, `cafeList`
- Imported once in `frontend/src/main.jsx` before the React tree renders

### Language Persistence

- On change: `i18n.changeLanguage(lang)` + `localStorage.setItem('sipspot_lang', lang)`
- On init: i18next reads `sipspot_lang` from localStorage
- No page reload — all `useTranslation` consumers re-render automatically

---

## Language Selector Component

**File**: `frontend/src/components/LangSelect.jsx`

- Native `<select>` element
- Placed in **`App.jsx` footer bottom bar** — the `<div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">` section
- This div currently has two children: a copyright `<p>` and a "Made with ☕" `<div>`. `LangSelect` becomes a **third flex item inserted between them**.
- On **mobile** (`flex-col`): appears as its own centred row between the copyright and "Made with ☕" rows.
- Options array (add new entries to extend):
  ```js
  const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ];
  ```
- Styled to match footer: `text-stone-400`, `bg-transparent`, `border border-stone-700`, small font, amber on focus
- On change: `i18n.changeLanguage(val)` + `localStorage.setItem('sipspot_lang', val)`

---

## Translation Scope

### `common.json`

All keys used in `Navbar.jsx` and the `App.jsx` footer:

| Key | English value |
|---|---|
| `nav.discover` | Discover |
| `nav.topRated` | Top Rated |
| `nav.nearMe` | Near Me |
| `nav.aiSearch` | AI Search |
| `nav.addCafe` | Add a Café |
| `auth.signIn` | Sign In |
| `auth.joinFree` | Join Free |
| `auth.signOut` | Sign Out |
| `auth.profile` | Profile |
| `auth.myCafes` | My Cafes |
| `auth.myFavorites` | My Favorites |
| `auth.myReviews` | My Reviews |
| `auth.adminPanel` | Admin Panel |
| `auth.loginPrompt` | Please sign in to add a café |
| `footer.discover` | Discover |
| `footer.community` | Community |
| `footer.company` | Company |
| `footer.support` | Support |
| `footer.links.topRated` | Top Rated |
| `footer.links.newOpenings` | New Openings |
| `footer.links.nearMe` | Near Me |
| `footer.links.aiSearch` | AI Search |
| `footer.links.allCafes` | All Cafés |
| `footer.links.writeReview` | Write a Review |
| `footer.links.addCafe` | Add a Café |
| `footer.links.awards` | SipSpot Awards |
| `footer.links.events` | Coffee Events |
| `footer.links.ambassador` | Ambassador Program |
| `footer.links.about` | About Us |
| `footer.links.press` | Press |
| `footer.links.careers` | Careers |
| `footer.links.partnerships` | Partnerships |
| `footer.links.contact` | Contact |
| `footer.links.helpCenter` | Help Center |
| `footer.links.privacy` | Privacy Policy |
| `footer.links.terms` | Terms of Use |
| `footer.links.cookies` | Cookie Settings |
| `footer.copyright` | © 2026 SipSpot, Inc. All rights reserved. |
| `footer.tagline` | Made with ☕ for coffee lovers everywhere |
| `shared.viewAll` | View all |
| `shared.search` | Search |
| `shared.filter` | Filter |
| `shared.clearAll` | Clear all |
| `shared.cancel` | Cancel |
| `shared.submit` | Submit |

### `home.json`

| Key | English value |
|---|---|
| `hero.tagline` | Your Next Favourite Coffee Shop Awaits |
| `hero.subtitle` | (hero supporting tagline) |
| `hero.searchName` | Coffee shop name… |
| `hero.searchCity` | City or neighbourhood… |
| `hero.searchButton` | Search |
| `aiSearch.placeholder` | Ask AI: "quiet café with fast WiFi near me…" |
| `aiSearch.button` | Ask AI |
| `aiSearch.tags.0` | Specialty Coffee |
| `aiSearch.tags.1` | Quiet Study Spot |
| `aiSearch.tags.2` | Dog Friendly |
| `aiSearch.tags.3` | Outdoor Seating |
| `aiSearch.tags.4` | Cold Brew |
| `stats.0.label` | Coffee Shops |
| `stats.1.label` | Reviews |
| `stats.2.label` | Cities |
| `featured.handpicked` | Handpicked for You |
| `featured.pickedForYou` | Picked for You |
| `featured.title` | Featured Coffee Shops |
| `featured.personalizedTitle` | Your Personalized Picks |
| `featured.personalizedBadge` | Personalized |
| `featured.viewAll` | View all shops → |
| `featured.categories.all` | All |
| `featured.categories.workFriendly` | Work-Friendly |
| `featured.categories.outdoor` | Outdoor |
| `featured.categories.quietSpace` | Quiet Space |
| `featured.categories.dogFriendly` | Dog Friendly |
| `featured.categories.specialtyCoffee` | Specialty Coffee |
| `featured.categories.newOpenings` | New Openings |
| `featured.empty` | No cafés found in this category yet. |
| `featured.emptyAction` | View all cafés |
| `badge.newOpening` | New Opening |
| `badge.editorsChoice` | Editor's Choice |
| `badge.verified` | Verified |
| `badge.topPick` | Top Pick |
| `badge.featured` | Featured |
| `howItWorks.heading` | How SipSpot Works |
| `howItWorks.stepLabel` | STEP |
| `howItWorks.steps.0.title` | Search & Filter |
| `howItWorks.steps.0.description` | Search by name, neighborhood, or vibe… |
| `howItWorks.steps.1.title` | Explore on Map |
| `howItWorks.steps.1.description` | View results on an interactive map… |
| `howItWorks.steps.2.title` | Read Real Reviews |
| `howItWorks.steps.2.description` | Dive into authentic reviews with photos… |
| `howItWorks.steps.3.title` | Share Your Experience |
| `howItWorks.steps.3.description` | Visited a great spot? Leave a review… |
| `vibes.heading` | Explore by Vibe |
| `vibes.0.name` | Work & Study |
| `vibes.0.count` | Laptop-friendly spaces |
| `vibes.1.name` | Outdoor Seating |
| `vibes.1.count` | Patios & terraces |
| `vibes.2.name` | Quiet Space |
| `vibes.2.count` | Peaceful & calm |
| `vibes.3.name` | Dog Friendly |
| `vibes.3.count` | Bring your pup |
| `vibes.4.name` | Specialty Coffee |
| `vibes.4.count` | Single origins & more |
| `vibes.5.name` | Power Outlets |
| `vibes.5.count` | Stay charged all day |
| `vibes.6.name` | Group Gatherings |
| `vibes.6.count` | Meet & celebrate |
| `vibes.7.name` | New Openings |
| `vibes.7.count` | Just opened |
| `reviews.heading` | What Our Community Says |
| `reviews.items.0.text` | (Maya Chen review text) |
| `reviews.items.0.tags.0` … | Pour Over, Quiet, Great Staff |
| `reviews.items.1.text` | (James Park review text) |
| `reviews.items.1.tags.0` … | Single Origin, In-House Roasting |
| `reviews.items.2.text` | (Sarah Liu review text) |
| `reviews.items.2.tags.0` … | Outdoor Seating, Dog Friendly, Cortado |
| `newsletter.heading` | Never Miss a Great Cup |
| `newsletter.body` | Newsletter body copy |
| `newsletter.placeholder` | Enter your email |
| `newsletter.button` | Subscribe |
| `newsletter.success` | You're on the list! |

### `cafeList.json`

| Key | English value |
|---|---|
| `header.title` | Discover Coffee Shops |
| `header.subtitle` | Subtitle copy |
| `search.namePlaceholder` | Search coffee shops… |
| `search.cityPlaceholder` | City or area |
| `filters.title` | Filters |
| `filters.rating` | Rating |
| `filters.price` | Price |
| `filters.amenities` | Amenities |
| `filters.vibe` | Vibe |
| `filters.sortBy` | Sort by |
| `filters.clearAll` | Clear all |
| `filters.sortOptions.highestRated` | Highest Rated |
| `filters.sortOptions.newestFirst` | Newest First |
| `filters.sortOptions.priceLow` | Price: Low to High |
| `filters.sortOptions.priceHigh` | Price: High to Low |
| `filters.sortOptions.nameAZ` | Name A – Z |
| `filters.priceLabels.budget` | ¥ Budget |
| `filters.priceLabels.moderate` | ¥¥ Moderate |
| `filters.priceLabels.upscale` | ¥¥¥ Upscale |
| `filters.priceLabels.luxury` | ¥¥¥¥ Luxury |
| `toolbar.results_one` | {{count}} café found |
| `toolbar.results_other` | {{count}} cafés found |
| `toolbar.grid` | Grid |
| `toolbar.list` | List |
| `banner.heading` | Know a great café? |
| `banner.body` | Add it to SipSpot and help the community |
| `banner.button` | Add a Café |
| `empty.heading` | No cafés found |
| `empty.body` | Try adjusting your filters |
| `empty.retry` | Clear filters |
| `pagination.previous` | Previous |
| `pagination.next` | Next |
| `pagination.indicator` | Page {{page}} of {{total}} |
| `card.reviews` | reviews |
| `card.openNow` | Open now |
| `card.closed` | Closed |
| `card.openDaily` | Open Daily |

**Note on pluralisation**: `toolbar.results_one` / `toolbar.results_other` use i18next's built-in plural suffix convention. Call: `t('toolbar.results', { count })` — i18next selects the correct key automatically.

### NOT Translated

- Cafe names, addresses, descriptions (user-generated)
- Review text (user-generated)
- Cafe amenity values stored in DB (already Chinese strings — intentional per data model)
- `AMENITY_MAP` / `SPECIALTY_MAP` English labels in `CafeCard.tsx` — these derive from DB values and are bilingual display mappings; **out of scope for this phase**
- Prices, ratings, review counts (numeric)

---

## homeData.js Changes

| Export | Actual shape | Action |
|---|---|---|
| `CATEGORIES` | `string[]` — English strings serve as both display values AND `CATEGORY_FILTERS` lookup keys | **Keep array unchanged** (filter logic must not break). For display, components map each string to a translation key using this fixed mapping: `'All'→'all'`, `'Work-Friendly'→'workFriendly'`, `'Outdoor'→'outdoor'`, `'Quiet Space'→'quietSpace'`, `'Dog Friendly'→'dogFriendly'`, `'Specialty Coffee'→'specialtyCoffee'`, `'New Openings'→'newOpenings'`. Display call: `t(\`featured.categories.${CATEGORY_KEY_MAP[cat]}\`)`. |
| `CATEGORY_FILTERS` | `{ [string]: (cafe) => bool }` | No change — logic only |
| `VIBES` | `{ name, count, emoji, gradient, filter }[]` | Remove `name` and `count`; keep `emoji`, `gradient`, `filter`. Components use `t(\`vibes.${i}.name\`)` and `t(\`vibes.${i}.count\`)` indexed by array position. |
| `HOW_IT_WORKS_STEPS` | `{ icon, step, title, description, color, border }[]` | Remove `title` and `description`; keep `icon`, `step`, `color`, `border`. Components use `t(\`howItWorks.steps.${i}.title\`)` etc. |
| `CURATED_REVIEWS` | `{ id, author, avatar, avatarColor, shop, rating, date, text, helpful, tags, image }[]` | Remove `text` and `tags`; keep all other fields. Components use `t(\`reviews.items.${i}.text\`)` and `t(\`reviews.items.${i}.tags.${j}\`)`. |
| `POPULAR_AI_TAGS` | `string[]` | Delete. Components use `t(\`aiSearch.tags.${i}\`)` for display. |
| `FOOTER_LINKS` | `{ [section]: string[] }` | Delete — dead code (comment on line 149 confirms it is "not currently rendered"). |
| `getCafeBadge()` | Returns `{ label: string, color: string }` or the homeData version always returns something | Update to return `{ key: string, color: string }` where `key` is one of: `'newOpening'`, `'editorsChoice'`, `'verified'`, `'topPick'`, `'featured'`. Callers do `t(\`badge.${badge.key}\`)`. |
| `HERO_STATS` | **Not in homeData** — defined as local `const STATS` inside `HeroStats.jsx` | Translate `label` field in `HeroStats.jsx` directly using `t('stats.N.label')`. |
| `AMENITY_TO_ENGLISH`, `SPECIALTY_TO_ENGLISH`, `DAY_NAMES`, `FALLBACK_IMAGES` | Utility/mapping data | No change |

---

## CafeCard.tsx Changes

`CafeCard.tsx` has its **own local `getCafeBadge()`** (independent of `homeData.js`). It must also be updated:
- Update to return `{ key: string; color: string } | null` using the same key strings (`'newOpening'`, `'editorsChoice'`, `'verified'`, `'topPick'`)
- Note: `CafeCard.tsx`'s version returns `null` when no badge applies (no `'featured'` fallback) — keep this behaviour
- Caller does `badge ? t(\`badge.${badge.key}\`) : null`

`getTodayHours()` hardcoded fallback `'Open Daily'` → `t('card.openDaily', { ns: 'cafeList' })`.

`AMENITY_MAP` and `SPECIALTY_MAP` English labels in `CafeCard.tsx` — **out of scope for this phase** (these map DB values to English display text; bilingual treatment of DB-derived labels is a separate concern).

---

## cafeListData.ts Changes

`SORT_OPTIONS` currently: `{ value: string; label: string }[]`

Update to: `{ value: string; labelKey: string }[]` where `labelKey` maps to a `cafeList.json` key:

| value | labelKey |
|---|---|
| `-rating` | `filters.sortOptions.highestRated` |
| `-createdAt` | `filters.sortOptions.newestFirst` |
| `price` | `filters.sortOptions.priceLow` |
| `-price` | `filters.sortOptions.priceHigh` |
| `name` | `filters.sortOptions.nameAZ` |

Consumers render: `t(option.labelKey)`.

---

## App.jsx Footer Changes

The footer in `App.jsx` (lines 251–267) renders column headings and link labels as **inline hardcoded strings** inside an `Object.entries({Discover: [...], Community: [...], Company: [...], Support: [...]})` map. These must be replaced with `t()` calls from the `common` namespace using the `footer.*` keys defined above. The inline object structure is replaced by reading keys from `common.json`.

Additionally: import and render `<LangSelect />` as a third flex item in the footer bottom bar (line ~270).

---

## Files Changed

### New files

| File | Purpose |
|---|---|
| `frontend/src/i18n.js` | i18next init: inline resources, `sipspot_lang` localStorage, `fallbackLng: 'en'` |
| `frontend/src/components/LangSelect.jsx` | Language `<select>` for footer |
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
| `frontend/src/main.jsx` | Import `./i18n` before React tree |
| `frontend/src/App.jsx` | Replace inline footer strings with `t('footer.*')`; add `<LangSelect />` as third flex item in footer bottom bar |
| `frontend/src/components/Navbar.jsx` | Replace all nav/auth strings with `t('common:nav.*')` / `t('common:auth.*')` |
| `frontend/src/utils/homeData.js` | Per table above: remove display strings, update `getCafeBadge()` to return keys |
| `frontend/src/utils/cafeListData.ts` | Replace `label` with `labelKey` in SORT_OPTIONS |
| `frontend/src/pages/Home.jsx` | Add `useTranslation('home')`; build `CATEGORY_KEY_MAP`; pass translated labels to CategoryFilterBar |
| `frontend/src/components/home/AISearchBar.jsx` | `useTranslation('home')` — `aiSearch.*` |
| `frontend/src/components/home/CategoryFilterBar.jsx` | Receives already-translated labels from parent — no direct `useTranslation` needed |
| `frontend/src/components/home/CommunityReviewsSection.jsx` | `useTranslation('home')` — `reviews.*` |
| `frontend/src/components/home/ExploreByVibeSection.jsx` | `useTranslation('home')` — `vibes.*` |
| `frontend/src/components/home/FeaturedShopsSection.jsx` | `useTranslation('home')` — `featured.*` |
| `frontend/src/components/home/HeroSearchBar.jsx` | `useTranslation('home')` — `hero.*` |
| `frontend/src/components/home/HeroSection.jsx` | `useTranslation('home')` — `hero.tagline`, `hero.subtitle` |
| `frontend/src/components/home/HeroStats.jsx` | `useTranslation('home')` — `stats.N.label` |
| `frontend/src/components/home/HowItWorksSection.jsx` | `useTranslation('home')` — `howItWorks.*` including `howItWorks.stepLabel` |
| `frontend/src/components/home/NewsletterSection.jsx` | `useTranslation('home')` — `newsletter.*` |
| `frontend/src/components/home/ReviewCard.jsx` | `useTranslation('home')` — `reviews.items.*` |
| `frontend/src/components/home/ShopCard.jsx` | `useTranslation('home')` — `badge.*`; `useTranslation('cafeList')` — `card.*` |
| `frontend/src/components/home/CardSkeleton.jsx` | No strings — **no change** |
| `frontend/src/components/home/StarRating.jsx` | No strings — **no change** |
| `frontend/src/pages/CafeListPage.tsx` | Add `useTranslation('cafeList')` |
| `frontend/src/components/CafeCard.tsx` | Update local `getCafeBadge()` to return keys; update `getTodayHours()` fallback; add `useTranslation('cafeList')` |
| All `frontend/src/components/cafe-list/*.tsx` | `useTranslation('cafeList')` for respective key groups |

---

## Extensibility

To add a third language:
1. Create `frontend/src/locales/{lang}/common.json`, `home.json`, `cafeList.json`
2. Import and register in `i18n.js`
3. Add `{ value: '{lang}', label: '...' }` to `LANGUAGES` in `LangSelect.jsx`

No structural changes required.

---

## Out of Scope (this phase)

- Other pages (CafeDetailPage, Profile, CreateCafePage, etc.)
- Backend API responses
- RTL layout support
- Automatic browser locale detection
- Font changes for Chinese text
- `AMENITY_MAP` / `SPECIALTY_MAP` bilingual treatment in `CafeCard.tsx`
