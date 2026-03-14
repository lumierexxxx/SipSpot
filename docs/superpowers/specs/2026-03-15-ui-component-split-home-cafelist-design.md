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
@radix-ui/react-tabs
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-avatar
class-variance-authority
clsx
tailwind-merge
sonner
```

Use `--legacy-peer-deps` because some Radix packages declare React 18 as a peer dep but React 19 is installed; this is a declaration lag, not a runtime incompatibility.

---

## 3. Shared UI Component Layer

Copy the following files verbatim from `Coffee Shop Discovery Homepage/src/app/components/ui/` into `frontend/src/components/ui/`:

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
| `sonner.tsx` | Toast notification wrapper (sonner library) |

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
- `FOOTER_LINKS`

Move helper functions to same file:
- `getCafeBadge()`
- `getCafeTags()`
- `getCafeHours()`
- `getCafeImage()`
- `getCafeAmenityIcons()`

### 4.2 New components under `frontend/src/components/home/`

| Component | Props | UI primitives | Responsibility |
|---|---|---|---|
| `HeroSection.jsx` | `children` (slot for search bars + stats) | — | Full-bleed hero image, gradient overlay, headline copy, scroll indicator |
| `HeroSearchBar.jsx` | `query`, `location`, `onQueryChange`, `onLocationChange`, `onSubmit` | `Input`, `Button` | Two-field search form (name + city) |
| `AISearchBar.jsx` | `value`, `onChange`, `onSubmit`, `popularTags` | `Button` | Frosted AI search input + popular tag pills |
| `HeroStats.jsx` | `stats[]` | — | Three stat numbers (shops / reviews / cities) |
| `FeaturedShopsSection.jsx` | `cafes`, `loading`, `activeCategory`, `onCategoryChange` | `Button`, `Skeleton` | Section heading + `CategoryFilterBar` + card grid |
| `CategoryFilterBar.jsx` | `categories[]`, `active`, `onChange` | `Button` | Horizontally scrollable category pill row |
| `ShopCard.jsx` | `cafe`, `index` | `Card`, `CardContent`, `Badge`, `Separator` | Individual cafe card with image, rating, tags, hours |
| `CardSkeleton.jsx` | — | `Skeleton` | Animated loading placeholder matching ShopCard dimensions |
| `HowItWorksSection.jsx` | — | `Card`, `CardContent`, `Separator` | Section heading + 4-step grid |
| `ExploreByVibeSection.jsx` | `vibes[]`, `onVibeClick` | `Button` | Section heading + 8 gradient vibe cards |
| `CommunityReviewsSection.jsx` | `reviews[]` | — | Section heading + review card grid |
| `ReviewCard.jsx` | `review` | `Card`, `CardContent`, `Avatar`, `AvatarFallback`, `Badge`, `Separator` | Review image, shop name, stars, quote, tags, author, helpful count |
| `StarRating.jsx` | `rating` | — | Row of 5 star icons filled to `rating` |
| `NewsletterSection.jsx` | `email`, `submitted`, `onChange`, `onSubmit` | `Input`, `Button` | Email signup form with success state |

### 4.3 Resulting Home.jsx

`Home.jsx` retains:
- State: `query`, `location`, `aiQuery`, `activeCategory`, `email`, `newsletterSubmitted`
- Data fetch: `useAPI(fetchTopRated)`
- `handleSearch`, `handleNewsletterSubmit` handlers
- JSX: imports and arranges section components only — no inline markup

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
| `CafeListToolbar.tsx` | `cafes.length`, `totalCount`, `filters`, `view`, `onSortChange`, `onViewChange`, `onFilterChange`, `onAmenityToggle` | `Button`, `Badge` | Results count + active chips + sort + view toggle |
| `ActiveFilterChips.tsx` | `filters`, `onFilterChange`, `onAmenityToggle` | `Badge`, `Button` | Removable filter chip row |
| `SortSelect.tsx` | `value`, `onChange`, `options[]` | `Select` (Radix) | Sort dropdown — replaces native `<select>` |
| `ViewToggle.tsx` | `view`, `onChange` | `Button` | Grid / list toggle icon buttons |
| `CafeGridSkeleton.tsx` | `count?` | `Skeleton` | Grid of skeleton cards — replaces spinner |
| `EmptyState.tsx` | `myOnly`, `hasError`, `errorMessage`, `onRetry`, `onClear`, `onAddCafe` | `Button` | No-results and error states |
| `CafePagination.tsx` | `currentPage`, `totalPages`, `onChange` | `Button` | Prev / page numbers (with ellipsis) / next |
| `AddCafeBanner.tsx` | `onAddCafe` | `Button` | Bottom "Know a great café?" CTA strip |
| `MobileFilterDrawer.tsx` | `open`, `onClose`, `filters`, `activeFilterCount`, `cafesCount`, `onFilterChange`, `onAmenityToggle`, `onClear` | `Sheet`, `Button` | Full-height slide-in filter panel for mobile |
| `FilterSidebarWrapper.tsx` | `filters`, `activeFilterCount`, `onFilterChange`, `onAmenityToggle`, `onClear` | — | Sticky desktop sidebar wrapping `CafeFilterPanel` |

Login prompt toast replaces the fixed-position div: call `toast()` from `sonner` directly in the `handleAddCafe` handler inside `CafeListPage.tsx`. The `<Toaster />` component mounts once in `App.jsx`.

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
  ├── CafeListHeader        (totalCount, myOnly, isLoggedIn, onAddCafe)
  ├── CafeSearchBar         (filters.search, handlers, activeFilterCount)
  ├── FilterSidebarWrapper  (filters, handlers) — desktop only
  ├── CafeListToolbar       (filters, cafes.length, totalCount, view, handlers)
  ├── CafeGridSkeleton      — while loading
  ├── EmptyState            — when no results
  ├── CafeCard grid/list    — CafeCard is an existing component
  ├── CafePagination        (currentPage, totalPages, onChange)
  ├── AddCafeBanner         (onAddCafe) — when results present
  └── MobileFilterDrawer    (open, onClose, filters, handlers)

Home (state owner)
  └── HeroSection
        ├── HeroSearchBar
        ├── AISearchBar
        └── HeroStats
  ├── FeaturedShopsSection
  │     ├── CategoryFilterBar
  │     └── ShopCard[] / CardSkeleton[]
  ├── HowItWorksSection
  ├── ExploreByVibeSection
  ├── CommunityReviewsSection
  │     └── ReviewCard[]
  └── NewsletterSection
```

---

## 7. File Naming & Import Alias

All new component files follow existing project conventions:
- PascalCase `.jsx` for JS components, `.tsx` for TypeScript components
- Imported via `@components/home/...` and `@components/cafe-list/...` (using the `@components` alias already configured in `vite.config.js`)
- Data utils imported via `@utils/homeData` and `@utils/cafeListData`

---

## 8. What Does NOT Change

- No changes to routing in `App.jsx` (pages remain at same routes)
- No changes to backend or API service files
- No changes to `CafeFilterPanel.tsx` (reused as-is inside `FilterSidebarWrapper` and `MobileFilterDrawer`)
- No changes to `CafeCard.tsx` (already a well-structured component)
- No changes to `AuthContext`, `api.js`, `cafesAPI.js`, or any other service

---

## 9. Testing Criteria

- `Home.jsx` renders without errors; search navigates to `/cafes?search=...`
- AI search navigates to `/ai-search?query=...`
- Category filter updates the displayed cafe grid
- Newsletter form shows success state after submit
- `CafeListPage.tsx` renders cafe grid with data
- Sort select updates `filters.sort` state
- Mobile filter sheet opens/closes correctly
- Pagination buttons change `currentPage`
- Login prompt toast appears when unauthenticated user clicks "Add a Café"
- Active filter chips each remove their respective filter on click
