// ============================================
// SipSpot Frontend - Navbar Component
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Menu, X, ChevronDown, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@contexts/AuthContext';

interface NavbarProps {
    transparent?: boolean
}

export default function Navbar({ transparent: _transparent = false }: NavbarProps) {
    const { user, isLoggedIn, logout } = useAuth();
    const { t } = useTranslation('common');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const td = t as (key: string) => string;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (href: string) => location.pathname === href || location.pathname + location.search === href;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        window.location.href = '/';
    };

    const navLinks = [
        { tKey: 'nav.discover', href: '/cafes' },
        { tKey: 'nav.topRated', href: '/cafes?sort=-rating' },
        { tKey: 'nav.nearMe', href: '/nearby' },
        { tKey: 'nav.aiSearch', href: '/ai-search' },
    ];

    const handleAddCafe = () => {
        if (isLoggedIn) {
            navigate('/cafes/new');
            setIsMobileMenuOpen(false);
        } else {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 3000);
        }
    };

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center">
                            <Coffee className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-stone-900" style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                            SipSpot
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`px-4 py-2 rounded-lg transition-colors ${isActive(link.href) ? 'text-amber-700 bg-amber-50' : 'text-stone-600 hover:text-amber-700 hover:bg-stone-50'}`}
                                style={{ fontSize: '0.9rem' }}
                            >
                                {td(link.tKey)}
                            </Link>
                        ))}
                    </div>

                    {/* Auth */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Add a Café */}
                        <button
                            onClick={handleAddCafe}
                            className="flex items-center gap-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-full transition-colors"
                            style={{ fontSize: '0.85rem', fontWeight: 500 }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t('nav.addCafe')}
                        </button>

                        {isLoggedIn ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2.5 border border-stone-200 rounded-full pr-4 pl-1 py-1 hover:border-amber-300 transition-colors"
                                    aria-expanded={isUserMenuOpen}
                                >
                                    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user?.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-amber-700" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                                                {user?.username?.[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-stone-700" style={{ fontSize: '0.85rem' }}>{user?.username}</span>
                                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
                                        <div className="px-4 py-3 border-b border-stone-100">
                                            <p className="text-stone-900" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.username}</p>
                                            <p className="text-stone-400 truncate" style={{ fontSize: '0.75rem' }}>{user?.email}</p>
                                        </div>
                                        {[
                                            { tKey: 'auth.profile', href: '/profile' },
                                            { tKey: 'auth.myCafes', href: '/my-cafes' },
                                            { tKey: 'auth.myFavorites', href: '/favorites' },
                                            { tKey: 'auth.myReviews', href: '/my-reviews' },
                                        ].map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="block px-4 py-2.5 text-stone-700 hover:bg-stone-50 hover:text-amber-700 transition-colors"
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                {td(item.tKey)}
                                            </Link>
                                        ))}
                                        {user?.role === 'admin' && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="block px-4 py-2.5 text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition-colors border-t border-stone-100"
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {t('auth.signOut')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-stone-700 hover:text-amber-700 transition-colors px-4 py-2 rounded-lg"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    {t('auth.signIn')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 rounded-full transition-colors"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    {t('auth.joinFree')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-stone-200 px-4 py-4 flex flex-col gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`px-3 py-2.5 rounded-xl ${isActive(link.href) ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:bg-stone-50'}`}
                            style={{ fontSize: '0.9rem' }}
                        >
                            {td(link.tKey)}
                        </Link>
                    ))}
                    <button
                        onClick={handleAddCafe}
                        className="flex items-center justify-center gap-2 mt-2 border border-amber-200 bg-amber-50 text-amber-700 py-2.5 rounded-xl"
                        style={{ fontSize: '0.9rem' }}
                    >
                        <Plus className="w-4 h-4" /> {t('nav.addCafe')}
                    </button>
                    <div className="flex gap-3 pt-2 border-t border-stone-100 mt-1">
                        {isLoggedIn ? (
                            <div className="flex flex-col gap-2 w-full">
                                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-stone-700 py-1" style={{ fontSize: '0.9rem' }}>{t('auth.profile')}</Link>
                                <Link to="/favorites" onClick={() => setIsMobileMenuOpen(false)} className="text-stone-700 py-1" style={{ fontSize: '0.9rem' }}>{t('auth.myFavorites')}</Link>
                                <button onClick={handleLogout} className="text-left text-rose-600 py-1" style={{ fontSize: '0.9rem' }}>{t('auth.signOut')}</button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 border border-stone-300 text-stone-700 py-2.5 rounded-full text-center" style={{ fontSize: '0.88rem' }}>{t('auth.signIn')}</Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 bg-amber-700 text-white py-2.5 rounded-full text-center" style={{ fontSize: '0.88rem' }}>{t('auth.joinFree')}</Link>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Login prompt toast */}
            {showLoginPrompt && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-stone-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 whitespace-nowrap z-50">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span style={{ fontSize: '0.88rem' }}>Please sign in to add a café</span>
                </div>
            )}
        </nav>

        {/* Backdrop for user menu */}
        {isUserMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />}
        </>
    );
}
