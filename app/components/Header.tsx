'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { optionalBackendUrl } from '../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../lib/auth';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const refreshSession = async () => {
    const session = await getAuthenticatedSession('customer');
    setUserName(session?.profile.name || session?.profile.email || '');
    if (!session || !optionalBackendUrl) {
      setCartCount(0);
      return;
    }
    try {
      const response = await fetch(`${optionalBackendUrl}/cart`, {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: 'no-store',
      });
      const data = response.ok ? await response.json() : null;
      setCartCount(data?.count || 0);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    void refreshSession();
    const refresh = () => void refreshSession();
    const closeProfile = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('authChanged', refresh);
    window.addEventListener('cartUpdated', refresh);
    document.addEventListener('mousedown', closeProfile);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('authChanged', refresh);
      window.removeEventListener('cartUpdated', refresh);
      document.removeEventListener('mousedown', closeProfile);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    setMenuOpen(false);
    router.push(value ? `/shop?search=${encodeURIComponent(value)}` : '/shop');
  };

  const logout = () => {
    clearAuthenticatedToken('customer');
    setUserName('');
    setCartCount(0);
    setProfileOpen(false);
    window.dispatchEvent(new Event('authChanged'));
    router.replace('/');
  };

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  const navClass = (href: string) => `${styles.navLink} ${isActive(href) ? styles.activeLink : ''}`.trim();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="Loopora home">
          <img src="/images/logo.svg" alt="Loopora" />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          <Link href="/" className={navClass('/')}>Home</Link>
          <Link href="/shop" className={navClass('/shop')}>Marketplace</Link>
          <Link href="/cart-pilot" className={`${styles.navCta} ${isActive('/cart-pilot') ? styles.activeCta : ''}`}>
            <i className="fas fa-wand-magic-sparkles" aria-hidden="true" />
            <span>CartPilot</span>
          </Link>
          <Link href="/merchant/login" className={navClass('/merchant')}>Merchant</Link>
        </nav>

        <div className={styles.actions}>
          <form className={styles.searchForm} role="search" onSubmit={submitSearch}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" className={styles.searchInput} aria-label="Search products" placeholder="Search products" />
            <button className={styles.searchButton} type="submit" aria-label="Search"><i className="fas fa-search" aria-hidden="true" /></button>
          </form>

          <Link href="/cart-pilot" className={`${styles.iconButton} ${styles.desktopMic}`} aria-label="Open voice AI concierge" title="Voice AI Concierge">
            <i className="fas fa-microphone" aria-hidden="true" />
          </Link>

          <Link href="/cart" className={styles.iconButton} aria-label={`Cart with ${cartCount} items`}>
            <i className="fas fa-shopping-basket" aria-hidden="true" />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>

          {userName ? (
            <div className={styles.profileWrap} ref={profileRef}>
              <button type="button" className={styles.profileButton} onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Account menu">
                <i className="far fa-user" aria-hidden="true" />
              </button>
              {profileOpen && (
                <div className={styles.profileMenu} role="menu">
                  <strong className={styles.profileName}>{userName}</strong>
                  <Link href="/account/dashboard" role="menuitem">My account</Link>
                  <Link href="/account/orders" role="menuitem">Orders</Link>
                  <button type="button" onClick={logout} role="menuitem">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.iconButton} aria-label="Sign in" title="Sign in"><i className="far fa-user" aria-hidden="true" /></Link>
          )}

          <button type="button" className={`${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ''}`} onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-controls="loopora-mobile-menu" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobilePanel} id="loopora-mobile-menu">
          <form className={styles.mobileSearch} role="search" onSubmit={submitSearch}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" className={styles.searchInput} aria-label="Search products" placeholder="Search products or coffee, breakfast…" />
            <button className={styles.searchButton} type="submit" aria-label="Search"><i className="fas fa-search" aria-hidden="true" /></button>
          </form>
          <div className={styles.mobileAiBadge}><i className="fas fa-sparkles" aria-hidden="true" /> AI shopping</div>
          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            <Link href="/cart-pilot" className={`${styles.navCta} ${isActive('/cart-pilot') ? styles.activeCta : ''}`}><i className="fas fa-wand-magic-sparkles" aria-hidden="true" /><span>Open CartPilot</span></Link>
            <div className={styles.mobileDivider} />
            <Link href="/" className={navClass('/')}>Home</Link>
            <Link href="/shop" className={navClass('/shop')}>Marketplace</Link>
            <Link href="/merchant/login" className={navClass('/merchant')}>Merchant Portal</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
