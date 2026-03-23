// ============================================
// SipSpot Frontend - Home Page
// ============================================
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI } from '@hooks/useAPI';
import { getTopRatedCafes } from '@services/cafesAPI';
import { CATEGORY_FILTERS, CURATED_REVIEWS } from '@utils/homeData';
import type { ICafe } from '@/types';

import HeroSection from '@components/home/HeroSection';
import HeroSearchBar from '@components/home/HeroSearchBar';
import AISearchBar from '@components/home/AISearchBar';
import HeroStats from '@components/home/HeroStats';
import FeaturedShopsSection from '@components/home/FeaturedShopsSection';
import HowItWorksSection from '@components/home/HowItWorksSection';
import ExploreByVibeSection from '@components/home/ExploreByVibeSection';
import CommunityReviewsSection from '@components/home/CommunityReviewsSection';
import NewsletterSection from '@components/home/NewsletterSection';

export default function Home() {
    const navigate = useNavigate();

    const [query, setQuery] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [email, setEmail] = useState<string>('');
    const [newsletterSubmitted, setNewsletterSubmitted] = useState<boolean>(false);

    const fetchTopRated = useCallback(() => getTopRatedCafes({ limit: 12 }), []);
    const { data: topRatedData, loading: cafesLoading } = useAPI(fetchTopRated, { immediate: true });

    const allCafes: ICafe[] = topRatedData?.cafes || [];
    const filteredCafes = allCafes.filter(CATEGORY_FILTERS[activeCategory] || (() => true));

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.set('search', query.trim());
        if (location.trim()) params.set('city', location.trim());
        navigate(`/cafes?${params.toString()}`);
    };

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) setNewsletterSubmitted(true);
    };

    return (
        <div>
            <HeroSection>
                <HeroSearchBar
                    query={query}
                    location={location}
                    onQueryChange={(e) => setQuery(e.target.value)}
                    onLocationChange={(e) => setLocation(e.target.value)}
                    onSubmit={handleSearch}
                />
                <AISearchBar />
                <HeroStats />
            </HeroSection>

            <FeaturedShopsSection
                cafes={filteredCafes}
                loading={cafesLoading}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                isPersonalized={false}
            />

            <HowItWorksSection />

            <ExploreByVibeSection />

            <CommunityReviewsSection reviews={CURATED_REVIEWS} />

            <NewsletterSection
                email={email}
                submitted={newsletterSubmitted}
                onChange={(e) => setEmail(e.target.value)}
                onSubmit={handleNewsletterSubmit}
            />
        </div>
    );
}
