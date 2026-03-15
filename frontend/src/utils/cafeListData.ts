// ============================================
// SipSpot — CafeListPage data constants
// ============================================

export const SORT_OPTIONS = [
    { value: '-rating',       labelKey: 'filters.sortOptions.highestRated' },
    { value: '-createdAt',    labelKey: 'filters.sortOptions.newestFirst' },
    { value: '-reviewCount',  labelKey: 'filters.sortOptions.mostReviewed' },
    { value: 'price',         labelKey: 'filters.sortOptions.priceLowHigh' },
    { value: 'name',          labelKey: 'filters.sortOptions.nameAZ' },
] as const;
