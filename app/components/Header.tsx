'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
    window.addEventListener('authChanged', refresh);
    window.addEventListener('cartUpdated', refresh);
    return () => {
      window.removeEventListener('authChanged', refresh);
      window.removeEventListener('cartUpdated', refresh);
    };
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/shop?search=${encodeURIComponent(value)}` : '/shop');
  };

  const logout = () => {
    clearAuthenticatedToken('customer');
    setUserName('');
    setCartCount(0);
    window.dispatchEvent(new Event('authChanged'));
    router.replace('/');
  };

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    return (
      <li className={active ? 'active' : ''}>
        <Link href={href} onMouseEnter={() => router.prefetch(href)}>{label}</Link>
      </li>
    );
  };

  return (
    <header className="site-header mo-left header style-2" style={{ marginBottom: 0, paddingBottom: 0 }}>
      <div className="sticky-header main-bar-wraper navbar-expand-lg">
        <div className="main-bar clearfix">
          <div className="container clearfix d-lg-flex d-block align-items-center">
            <div className="logo-header logo-dark">
              <Link href="/" aria-label="Aisle AI home"><img src="/images/logo.svg" alt="Aisle AI" /></Link>
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
              <div className="logo-header">
                <Link href="/" aria-label="Aisle AI home"><img src="/images/logo.svg" alt="Aisle AI" /></Link>
              </div>
              <ul className="nav navbar-nav">
                {navLink('/', 'Home')}
                {navLink('/shop', 'Marketplace')}
                {navLink('/copilot-lab', 'Live Copilot')}
                {navLink('/evidence', 'Evidence')}
                {navLink('/trust', 'Trust')}
              </ul>
              <div className="dz-social-icon">
                <ul>
                  <li><Link href="/copilot-lab" aria-label="Open Live Copilot"><i className="fa-solid fa-wand-magic-sparkles"></i></Link></li>
                  <li><Link href="/evidence" aria-label="Open evidence"><i className="fa-solid fa-chart-line"></i></Link></li>
                  <li><Link href="/trust" aria-label="Open trust center"><i className="fa-solid fa-shield-halved"></i></Link></li>
                </ul>
              </div>
            </div>

            <div className="extra-nav d-flex align-items-center ms-lg-auto">
              <div className="extra-cell d-none d-xl-block me-2">
                <form className="header-item-search" role="search" onSubmit={submitSearch}>
                  <div className="input-group search-input">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      name="search"
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
                  <li className="nav-item me-2">
                    <Link href="/cart" className="nav-link" aria-label={`Cart with ${cartCount} items`}>
                      <i className="flaticon flaticon-basket"></i>
                      {cartCount > 0 && <span className="badge bg-primary ms-1">{cartCount}</span>}
                    </Link>
                  </li>
                  {userName ? (
                    <>
                      <li className="nav-item me-2"><Link href="/account/dashboard" className="nav-link" title={userName}><i className="far fa-user"></i></Link></li>
                      <li className="nav-item me-2"><button type="button" className="btn btn-link nav-link p-0" onClick={logout} aria-label="Sign out"><i className="fas fa-arrow-right-from-bracket"></i></button></li>
                    </>
                  ) : (
                    <li className="nav-item me-2"><Link href="/login" className="btn btn-outline-secondary btn-sm">Sign in</Link></li>
                  )}
                  <li className="nav-item"><Link href="/merchant/login" className="btn btn-secondary btn-sm">Merchant</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
