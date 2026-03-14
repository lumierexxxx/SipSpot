# UI Component Split — Home & CafeListPage

**Date:** 2026-03-15
**Scope:** `frontend/src/pages/Home.jsx`, `frontend/src/pages/CafeListPage.tsx`
**Goal:** Break both monolithic pages into small, focused components. Introduce a shared `ui/` component layer ported from the Coffee Shop Discovery Homepage reference project.

---

## 1. Motivation

Both pages are monolithic files with 500–700+ lines of mixed layout, data logic, and sub-components. This makes them hard to read, test, and reuse. The reference project (`Coffee Shop Discovery Homepage/src/app/components/ui/`) contains a ready-made shadcn/ui component set that provides accessible, well-typed primitives we can build on.

---

## 2. Dependency Installation

Install in `frontend/`:

```
@radix-ui/react-slot
@radix-ui/react-dialog
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-avatar
@radix-ui/react-label
class-variance-authority
clsx
tailwind-merge
sonner
```

> All Radix packages require `--legacy-peer-deps` due to the React 18 peer dep declaration lag.

Use `--legacy-peer-deps` because some Radix packages declare React 18 as a peer dep but React 19 is installed; this is a declaration lag, not a runtime incompatibility.

---

## 3. Shared UI Component Layer

Copy the following files from `Coffee Shop Discovery Homepage/src/app/components/ui/` into `frontend/src/components/ui/`.

**Note on copying:** Several files contain a `"use client"` directive at line 1. This is a Next.js/RSC boundary marker — harmless but meaningless in a Vite app. Strip it from each copied file. `sonner.tsx` imports `useTheme` from `next-themes` (a Next.js-only package). Replace the entire `sonner.tsx` file with a minimal wrapper that imports `Toaster` directly from `sonner` without theme support (see §3.1).

| File | Purpose |
|---|---|
| `utils.ts` | `cn()` helper — combines clsx + tailwind-merge |
| `button.tsx` | Polymorphic button with variant + size props |
| `badge.tsx` | Inline label chip |
| `card.tsx` | Card + CardHeader + CardContent + CardFooter + CardTitle + CardDescription + CardAction |
| `input.tsx` | Styled text input |
| `skeleton.tsx` | Animated loading placeholder |
| `separator.tsx` | Horizontal/vertical rule |
| `avatar.tsx` | Avatar + AvatarImage + AvatarFallback |
| `select.tsx` | Radix-based accessible select dropdown |
| `sheet.tsx` | Radix-based slide-in panel (for mobile drawer) |
| `label.tsx` | Form field label |
| `sonner.tsx` | Minimal Toaster wrapper — see §3.1 |

### 3.1 Custom `sonner.tsx`

Instead of copying the reference file, create:

```tsx
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return <SonnerToaster richColors closeButton />;
}
```

Mount `<Toaster />` once in `App.jsx`. Call `toast()` from `sonner` directly at the usage site.

The `cn()` utility replaces all ad-hoc template literal class joins throughout both pages and their sub-components.

---

## 4. Home.jsx Decomposition

### 4.1 Data constants

Move to `frontend/src/utils/homeData.js`:
- `AMENITY_TO_ENGLISH`
- `SPECIALTY_TO_ENGLISH`
- `DAY_NAMES`
- `FALLBACK_IMAGES`
- `CATEGORIES`
- `CATEGORY_FILTERS`
- `CURATED_REVIEWS`
- `VIBES`
- `HOW_IT_WORKS_STEPS`
- `POPULAR_AI_TAGS` (extracted from the inline array on line 441 of current `Home.jsx`)

`FOOTER_LINKS` is defined in `Home.jsx` but `Home` renders no footer — the constant is unused. Move it to `homeData.js` for future use but do not create a FooterSection component in this task.

Move helper functions to same file:
- `getCafeBadge()`
- `getCafeTags()`
- `getCafeHours()`
- `getCafeImage()`
- `getCafeAmenityIcons()`

### 4.2 New components under `frontend/src/components/home/`

| Component | Props | UI primitives | Responsibility |
|---|---|---|---|
| `HeroSection.jsx` | `children` | — | Full-bleed hero image, gradient overlay, headline copy, scroll indicator. Composes `HeroSearchBar`, `AISearchBar`, and `HeroStats` via `children` — `Home.jsx` passes them in explicitly. |
| `HeroSearchBar.jsx` | `query`, `location`, `onQueryChange`, `onLocationChange`, `onSubmit` | `Input`, `Button` | Two-field search form (name + city) |
| `AISearchBar.jsx` | `value`, `onChange`, `onSubmit` | `Button` | Frosted AI search input + popular tag pills. `POPULAR_AI_TAGS` is imported directly from `homeData.js` — not a prop. |
| `HeroStats.jsx` | — | — | Three static stat numbers (2,400+ shops / 18K+ reviews / 50+ cities). No props — values are static. |
| `FeaturedShopsSection.jsx` | `cafes`, `loading`, `activeCategory`, `onCategoryChange` | `Button`, `Skeleton` | Section heading + `CategoryFilterBar` + card grid. Receives `filteredCafes` (already filtered by `Home`) as `cafes` prop. Does not re-apply category filtering. |
| `CategoryFilterBar.jsx` | `categories[]`, `active`, `onChange` | `Button` | Horizontally scrollable category pill row |
| `ShopCard.jsx` | `cafe`, `index` | `Card`, `CardContent`, `Badge`, `Separator` | Individual cafe card for the Home page featured section. Separate from the existing `CafeCard.tsx` which is used in list/search pages — `ShopCard` has a slightly different layout (taller image at 208px, uses `¥` price prefix, has a like button with local state). Both coexist intentionally; they serve different visual contexts. |
| `CardSkeleton.jsx` | — | `Skeleton` | Animated loading placeholder matching ShopCard dimensions |
| `HowItWorksSection.jsx` | — | `Card`, `CardContent`, `Separator` | Section heading + 4-step grid. All data from `HOW_IT_WORKS_STEPS` imported from `homeData.js`. |
| `ExploreByVibeSection.jsx` | — | — | Section heading + 8 gradient vibe cards. Handles navigation internally via `useNavigate()` — no `onVibeClick` prop needed. `VIBES` imported from `homeData.js`. |
| `CommunityReviewsSection.jsx` | `reviews[]` | — | Section heading + review card grid |
| `ReviewCard.jsx` | `review` | `Card`, `CardContent`, `Avatar`, `AvatarFallback`, `Badge`, `Separator` | Review image, shop name, stars, quote, tags, author, helpful count |
| `StarRating.jsx` | `rating` | — | Row of 5 star icons filled to `rating` |
| `NewsletterSection.jsx` | `email`, `submitted`, `onChange`, `onSubmit` | `Input`, `Button` | Email signup form with success state |

### 4.3 Resulting Home.jsx

`Home.jsx` retains:
- State: `query`, `location`, `aiQuery`, `activeCategory`, `email`, `newsletterSubmitted`
- Data fetch: `useAPI(fetchTopRated)`
- Computed: `filteredCafes = allCafes.filter(CATEGORY_FILTERS[activeCategory])`
- Handlers: `handleSearch`, `handleNewsletterSubmit`
- Navigation is handled inside `AISearchBar` (for AI search) and `ExploreByVibeSection` (for vibe navigation) via their own `useNavigate()` calls — Home does not manage these
- JSX: imports and arranges section components only — no inline markup beyond layout scaffolding

---

## 5. CafeListPage.tsx Decomposition

### 5.1 Data constants

Move to `frontend/src/utils/cafeListData.ts`:
- `SORT_OPTIONS`

### 5.2 New components under `frontend/src/components/cafe-list/`

| Component | Props | UI primitives | Responsibility |
|---|---|---|---|
| `CafeListHeader.tsx` | `myOnly`, `totalCount`, `isLoggedIn`, `onAddCafe` | `Button` | Page title, subtitle, Add a Café button |
| `CafeSearchBar.tsx` | `value`, `onChange`, `onClear`, `onSubmit`, `onOpenFilters`, `activeFilterCount` | `Input`, `Button` | Search input with clear button + mobile filter trigger |
| `CafeListToolbar.tsx` | `resultCount`, `totalCount`, `filters`, `view`, `onSortChange`, `onViewChange`, `onFilterChange`, `onAmenityToggle` | `Button`, `Badge` | Results count + `ActiveFilterChips` + `SortSelect` + `ViewToggle`. Renders `ActiveFilterChips` as a sub-component internally. |
| `ActiveFilterChips.tsx` | `filters`, `onFilterChange`, `onAmenityToggle` | `Badge`, `Button` | Removable filter chip row. Imports `AMENITY_LABEL` from `@components/CafeFilterPanel` for chip labels. |
| `SortSelect.tsx` | `value`, `onChange`, `options[]` | `Select` (Radix) | Sort dropdown — replaces native `<select>` |
| `ViewToggle.tsx` | `view`, `onChange` | `Button` | Grid / list toggle icon buttons |
| `CafeGridSkeleton.tsx` | `count?` | `Skeleton` | Grid of skeleton cards — replaces spinner |
| `EmptyState.tsx` | `myOnly`, `hasError`, `errorMessage`, `onRetry`, `onClear`, `onAddCafe` | `Button` | No-results and error states |
| `CafePagination.tsx` | `currentPage`, `totalPages`, `onChange` | `Button` | Prev / page numbers (with ellipsis) / next |
| `AddCafeBanner.tsx` | `onAddCafe` | `Button` | Bottom "Know a great café?" CTA strip |
| `MobileFilterDrawer.tsx` | `open`, `onClose`, `filters`, `activeFilterCount`, `resultCount`, `onFilterChange`, `onAmenityToggle`, `onClear` | `Sheet`, `Button` | Full-height slide-in filter panel for mobile. Uses `resultCount` (same name as `CafeListToolbar`) for "Show N Results" button. |
| `FilterSidebarWrapper.tsx` | `filters`, `activeFilterCount`, `onFilterChange`, `onAmenityToggle`, `onClear` | — | Sticky desktop sidebar wrapping `CafeFilterPanel` |

Login prompt replaces the fixed-position div: call `toast()` from `sonner` directly in `handleAddCafe` inside `CafeListPage.tsx`. The `<Toaster />` from `sonner.tsx` mounts once in `App.jsx`.

### 5.3 Resulting CafeListPage.tsx

`CafeListPage.tsx` retains:
- All state (filters, pagination, view, loading, error)
- `loadCafes`, `handleFilterChange`, `handleAmenityToggle`, `handleClearFilters`, `handleSearch`, `handlePageChange`, `handleAddCafe`
- URL sync `useEffect`
- JSX: layout scaffolding + sub-component imports only

---

## 6. Component Boundaries & Data Flow

```
CafeListPage (state owner)
  ├── CafeListHeader          (totalCount, myOnly, isLoggedIn, onAddCafe)
  ├── CafeSearchBar           (filters.search, handlers, activeFilterCount)
  ├── FilterSidebarWrapper    (filters, handlers) — desktop only
  ├── CafeListToolbar
  │     ├── resultCount, totalCount, view, onSortChange, onViewChange
  │     ├── ActiveFilterChips (filters, onFilterChange, onAmenityToggle)
  │     ├── SortSelect        (value, onChange, options)
  │     └── ViewToggle        (view, onChange)
  ├── CafeGridSkeleton        — while loading
  ├── EmptyState              — when no results or error
  ├── CafeCard grid/list      — existing CafeCard.tsx component
  ├── CafePagination          (currentPage, totalPages, onChange)
  ├── AddCafeBanner           (onAddCafe) — when results present
  └── MobileFilterDrawer      (open, onClose, filters, resultCount, handlers)

Home (state owner)
  └── HeroSection (children)
        ├── HeroSearchBar     (query, location, handlers)
        ├── AISearchBar       (value, onChange, onSubmit)
        └── HeroStats
  ├── FeaturedShopsSection    (filteredCafes as cafes, loading, activeCategory, onCategoryChange)
  │     ├── CategoryFilterBar (categories, active, onChange)
  │     └── ShopCard[] / CardSkeleton[]
  ├── HowItWorksSection
  ├── ExploreByVibeSection    (internal useNavigate — no props)
  ├── CommunityReviewsSection (reviews)
  │     └── ReviewCard[]
  └── NewsletterSection       (email, submitted, onChange, onSubmit)
```

---

## 7. File Naming & Import Alias

All new component files follow existing project conventions:
- PascalCase `.jsx` for JS components, `.tsx` for TypeScript components
- Imported via `@components/home/...` and `@components/cafe-list/...` (the `@components` alias maps to `src/components/` in `vite.config.js`)
- Data utils imported via `@utils/homeData` and `@utils/cafeListData`

---

## 8. What Does NOT Change

- No changes to routing in `App.jsx` beyond adding `<Toaster />`
- No changes to backend or API service files
- `CafeFilterPanel.tsx` is unchanged; its `AMENITY_LABEL` export is consumed by the new `ActiveFilterChips.tsx`
- `CafeCard.tsx` is unchanged — it is used in `CafeListPage`, `AISearchPage`, and elsewhere
- `AuthContext`, `api.js`, `cafesAPI.js`, and all other services are unchanged

---

## 9. Testing Criteria

- `Home.jsx` renders without errors; search navigates to `/cafes?search=...`
- AI search navigates to `/ai-search?query=...`
- Category filter updates the displayed cafe grid
- Newsletter form shows success state after submit
- `CafeListPage.tsx` renders cafe grid with data
- Sort select (Radix) updates `filters.sort` state
- Mobile filter sheet opens/closes correctly
- Pagination buttons change `currentPage`
- Login prompt `sonner` toast appears when unauthenticated user clicks "Add a Café"
- Active filter chips each remove their respective filter on click
- `ShopCard` and `CafeCard` both render without errors in their respective pages
