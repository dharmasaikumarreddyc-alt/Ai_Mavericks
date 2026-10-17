'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { optionalBackendUrl } from '../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../lib/auth';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);

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
    window.addEventListener('authChanged', refresh);
    window.addEventListener('cartUpdated', refresh);
    document.addEventListener('mousedown', closeProfile);
    return () => {
      window.removeEventListener('authChanged', refresh);
      window.removeEventListener('cartUpdated', refresh);
      document.removeEventListener('mousedown', closeProfile);
    };
  }, []);

  useEffect(() => {
    setCategoryOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
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

  return (
    <header className="site-header mo-left header style-2 legacy-loopora-header">
      <div className="sticky-header main-bar-wraper navbar-expand-lg">
        <div className="main-bar clearfix">
          <div className="container clearfix d-lg-flex d-block align-items-center">
            <div className="logo-header logo-dark">
              <Link href="/" aria-label="Loopora home">
                <img src="/images/logo.svg" alt="Loopora" />
              </Link>
            </div>

            <button
              className="navbar-toggler collapsed navicon justify-content-end"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNavDropdown"
              aria-controls="navbarNavDropdown"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span></span><span></span><span></span>
            </button>

            <div className="header-nav w3menu navbar-collapse collapse justify-content-start" id="navbarNavDropdown">
              <div className="logo-header d-lg-none">
                <Link href="/"><img src="/images/logo.svg" alt="Loopora" /></Link>
              </div>

              <div className="browse-category-menu d-none d-xl-block">
                <button
                  type="button"
                  className="category-btn border-0"
                  onClick={() => setCategoryOpen((current) => !current)}
                  aria-expanded={categoryOpen}
                >
                  <div className="category-menu me-3"><span></span><span></span><span></span></div>
                  <span className="category-btn-title">Browse Food &amp; Drinks</span>
                  <span className="toggle-arrow ms-auto"><i className="icon feather icon-chevron-down"></i></span>
                </button>
                <div className="category-menu-items" style={{ display: categoryOpen ? 'block' : 'none' }}>
                  <ul className="nav navbar-nav">
                    <li><Link href="/shop?search=breakfast">Breakfast</Link></li>
                    <li><Link href="/shop?search=coffee">Coffee &amp; Drinks</Link></li>
                    <li><Link href="/shop?search=bakery">Bakery</Link></li>
                    <li><Link href="/shop?search=healthy">Healthy Choices</Link></li>
                  </ul>
                </div>
              </div>

              <ul className="nav navbar-nav legacy-primary-nav">
                <li className={isActive('/') ? 'active' : ''}><Link href="/">Home</Link></li>
                <li className={isActive('/shop') ? 'active' : ''}><Link href="/shop">Marketplace</Link></li>
                <li className={`sub-menu-down ${isActive('/cart-pilot') || isActive('/copilot-lab') ? 'active' : ''}`}>
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    <span>AI Shopping</span><i className="fas fa-chevron-down tabindex"></i>
                  </a>
                  <ul className="sub-menu">
                    <li><Link href="/cart-pilot">Voice AI Concierge</Link></li>
                    <li><Link href="/copilot-lab">Live Copilot Lab</Link></li>
                  </ul>
                </li>
                <li className={`sub-menu-down ${isActive('/evidence') || isActive('/trust') ? 'active' : ''}`}>
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    <span>How It Works</span><i className="fas fa-chevron-down tabindex"></i>
                  </a>
                  <ul className="sub-menu">
                    <li><Link href="/evidence">Evidence &amp; Architecture</Link></li>
                    <li><Link href="/trust">Trust &amp; Governance</Link></li>
                  </ul>
                </li>
                <li className={pathname.startsWith('/merchant') ? 'active' : ''}><Link href="/merchant/login">Merchant</Link></li>
              </ul>

              <div className="dz-social-icon d-lg-none">
                <ul>
                  <li><Link href="/cart-pilot" aria-label="Voice AI concierge"><i className="fas fa-microphone"></i></Link></li>
                  <li><Link href="/copilot-lab" aria-label="Live Copilot"><i className="fas fa-wand-magic-sparkles"></i></Link></li>
                  <li><Link href="/trust" aria-label="Trust center"><i className="fas fa-shield-halved"></i></Link></li>
                </ul>
              </div>
            </div>

            <div className="extra-nav d-flex align-items-center ms-lg-auto">
              <div className="extra-cell d-none d-xxl-block me-2">
                <form className="header-item-search" role="search" onSubmit={submitSearch}>
                  <div className="input-group search-input">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      type="search"
                      className="form-control"
                      aria-label="Search products"
                      placeholder="Search products"
                    />
                    <button className="btn" type="submit" aria-label="Search"><i className="iconly-Light-Search text-secondary"></i></button>
                  </div>
                </form>
              </div>

              <div className="extra-cell">
                <ul className="navbar-nav header-right m-0 d-flex flex-row align-items-center">
                  <li className="nav-item me-1 d-none d-md-block">
                    <Link href="/cart-pilot" className="nav-link" aria-label="Voice AI Concierge" title="Voice AI Concierge"><i className="fas fa-microphone"></i></Link>
                  </li>
                  <li className="nav-item me-1">
                    <Link href="/cart" className="nav-link legacy-cart-link" aria-label={`Cart with ${cartCount} items`}>
                      <i className="flaticon flaticon-basket"></i>
                      {cartCount > 0 && <span className="badge bg-primary legacy-cart-count">{cartCount}</span>}
                    </Link>
                  </li>
                  {userName ? (
                    <li className="nav-item position-relative" ref={profileRef}>
                      <button type="button" className="nav-link legacy-profile-trigger border-0 bg-transparent" onClick={() => setProfileOpen((current) => !current)} aria-expanded={profileOpen} aria-label="Account menu">
                        <i className="far fa-user"></i>
                      </button>
                      {profileOpen && (
                        <div className="legacy-profile-menu">
                          <strong>{userName}</strong>
                          <Link href="/account/dashboard">My account</Link>
                          <Link href="/account/orders">Orders</Link>
                          <button type="button" onClick={logout}>Sign out</button>
                        </div>
                      )}
                    </li>
                  ) : (
                    <li className="nav-item"><Link href="/login" className="nav-link" aria-label="Sign in" title="Sign in"><i className="far fa-user"></i></Link></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
