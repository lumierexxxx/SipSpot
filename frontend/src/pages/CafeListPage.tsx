// ============================================
// SipSpot — CafeListPage
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@contexts/AuthContext';
import CafeCard from '@components/CafeCard';
import { searchAndFilterCafes } from '@services/cafesAPI';
import type { Cafe, FilterState } from '@/types/cafe';

import CafeListHeader from '@components/cafe-list/CafeListHeader';
import CafeSearchBar from '@components/cafe-list/CafeSearchBar';
import CafeListToolbar from '@components/cafe-list/CafeListToolbar';
import CafeGridSkeleton from '@components/cafe-list/CafeGridSkeleton';
import EmptyState from '@components/cafe-list/EmptyState';
import CafePagination from '@components/cafe-list/CafePagination';
import AddCafeBanner from '@components/cafe-list/AddCafeBanner';
import FilterSidebarWrapper from '@components/cafe-list/FilterSidebarWrapper';
import MobileFilterDrawer from '@components/cafe-list/MobileFilterDrawer';

interface CafeListPageProps {
    myOnly?: boolean;
}

interface Pagination {
    pages: number;
    total: number;
}

interface ApiResponse {
    data?: Cafe[];
    pagination?: Pagination;
}

export default function CafeListPage({ myOnly = false }: CafeListPageProps) {
    const navigate = useNavigate();
    const { userId, isLoggedIn } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [cafes, setCafes] = useState<Cafe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [filters, setFilters] = useState<FilterState>({
        search: searchParams.get('search') ?? '',
        city: searchParams.get('city') ?? '',
        minRating: searchParams.get('minRating') ?? '',
        maxPrice: searchParams.get('maxPrice') ?? '',
        amenities: searchParams.getAll('amenities'),
        vibe: searchParams.get('vibe') ?? '',
        sort: searchParams.get('sort') ?? '-rating',
    });

    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const activeFilterCount =
        (filters.city ? 1 : 0) +
        (filters.minRating ? 1 : 0) +
        (filters.maxPrice ? 1 : 0) +
        (filters.vibe ? 1 : 0) +
        filters.amenities.length;

    // ── Sync URL ──────────────────────────────────────────────────────────────

    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.search)    params.set('search', filters.search);
        if (filters.city)      params.set('city', filters.city);
        if (filters.minRating) params.set('minRating', filters.minRating);
        if (filters.maxPrice)  params.set('maxPrice', filters.maxPrice);
        if (filters.vibe)      params.set('vibe', filters.vibe);
        if (filters.sort)      params.set('sort', filters.sort);
        filters.amenities.forEach(a => params.append('amenities', a));
        setSearchParams(params);
    }, [filters, setSearchParams]);

    // ── Load cafes ────────────────────────────────────────────────────────────

    const loadCafes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params: Record<string, unknown> = { page: currentPage, limit: 12, ...filters, query: filters.search };
            if (myOnly && userId) params.author = userId;
            const response: ApiResponse = await searchAndFilterCafes(params);
            setCafes(response.data ?? []);
            if (response.pagination) {
                setTotalPages(response.pagination.pages);
                setTotalCount(response.pagination.total);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load cafes';
            console.error('Failed to load cafes:', err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters, myOnly, userId]);

    useEffect(() => { loadCafes(); }, [loadCafes]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleAmenityToggle = (key: string) => {
        setFilters(prev => {
            const amenities = prev.amenities.includes(key)
                ? prev.amenities.filter(a => a !== key)
                : [...prev.amenities, key];
            return { ...prev, amenities };
        });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ search: '', city: '', minRating: '', maxPrice: '', amenities: [], vibe: '', sort: '-rating' });
        setCurrentPage(1);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        loadCafes();
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddCafe = () => {
        if (isLoggedIn) {
            navigate('/cafes/new');
        } else {
            toast('Please sign in to add a café', {
                icon: '☕',
                duration: 4000,
            });
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div>
            <CafeListHeader
                myOnly={myOnly}
                totalCount={totalCount}
                isLoggedIn={isLoggedIn}
                onAddCafe={handleAddCafe}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <CafeSearchBar
                    value={filters.search}
                    onChange={value => handleFilterChange('search', value)}
                    onClear={() => handleFilterChange('search', '')}
                    onSubmit={handleSearch}
                    onOpenFilters={() => setShowMobileFilters(true)}
                    activeFilterCount={activeFilterCount}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-7">
                <FilterSidebarWrapper
                    filters={filters}
                    activeFilterCount={activeFilterCount}
                    onFilterChange={handleFilterChange}
                    onAmenityToggle={handleAmenityToggle}
                    onClear={handleClearFilters}
                />

                <div className="flex-1 min-w-0">
                    <CafeListToolbar
                        resultCount={cafes.length}
                        totalCount={totalCount}
                        filters={filters}
                        view={view}
                        onSortChange={value => handleFilterChange('sort', value)}
                        onViewChange={setView}
                        onFilterChange={handleFilterChange}
                        onAmenityToggle={handleAmenityToggle}
                    />

                    {loading && <CafeGridSkeleton />}

                    {!loading && (error || cafes.length === 0) && (
                        <EmptyState
                            myOnly={myOnly}
                            hasError={!!error}
                            errorMessage={error}
                            onRetry={loadCafes}
                            onClear={handleClearFilters}
                            onAddCafe={handleAddCafe}
                        />
                    )}

                    {!loading && !error && cafes.length > 0 && (
                        view === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {cafes.map(cafe => <CafeCard key={cafe._id ?? cafe.id} cafe={cafe} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {cafes.map(cafe => <CafeCard key={cafe._id ?? cafe.id} cafe={cafe} view="list" />)}
                            </div>
                        )
                    )}

                    <CafePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChange={handlePageChange}
                    />

                    {!loading && !error && cafes.length > 0 && !myOnly && (
                        <AddCafeBanner onAddCafe={handleAddCafe} />
                    )}
                </div>
            </div>

            <MobileFilterDrawer
                open={showMobileFilters}
                onClose={() => setShowMobileFilters(false)}
                filters={filters}
                activeFilterCount={activeFilterCount}
                resultCount={cafes.length}
                onFilterChange={handleFilterChange}
                onAmenityToggle={handleAmenityToggle}
                onClear={handleClearFilters}
            />
        </div>
    );
}
