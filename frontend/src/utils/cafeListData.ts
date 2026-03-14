// ============================================
// SipSpot — CafeListPage data constants
// ============================================

export const SORT_OPTIONS = [
    { value: '-rating',    label: 'Highest Rated' },
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price',      label: 'Price: Low to High' },
    { value: '-price',     label: 'Price: High to Low' },
    { value: 'name',       label: 'Name A – Z' },
] as const;
