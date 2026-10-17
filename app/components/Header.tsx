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
    if (!session || !optionalBackendUrl) return setCartCount(0);
    try {
      const response = await fetch(`${optionalBackendUrl}/cart`, {
        headers: { Authorization: `Bearer ${session.token}` }, cache: 'no-store',
      });
      const data = response.ok ? await response.json() : null;
      setCartCount(data?.count || 0);
    } catch { setCartCount(0); }
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

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/shop?search=${encodeURIComponent(value)}` : '/shop');
  };

  const logout = () => {
    clearAuthenticatedToken('customer');
    window.dispatchEvent(new Event('authChanged'));
    router.replace('/');
  };

  const nav = (href: string, label: string) => (
    <Link className={pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)) ? 'active' : ''} href={href} onMouseEnter={() => router.prefetch(href)}>{label}</Link>
  );

  return (
    <header className="aisle-header">
      <div className="aisle-header-inner">
        <Link className="aisle-header-brand" href="/" aria-label="Aisle AI home">
          <img src="/images/logo.svg" alt="Aisle AI" />
          <span><strong>Aisle AI</strong><small>Powered by Gemini</small></span>
        </Link>
        <nav className="aisle-header-nav" aria-label="Primary navigation">
          {nav('/', 'Home')}
          {nav('/shop', 'Marketplace')}
          {nav('/copilot-lab', 'Live Copilot')}
          {nav('/evidence', 'Evidence')}
          {nav('/trust', 'Trust')}
        </nav>
        <form className="aisle-header-search" role="search" onSubmit={submitSearch}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search products…" aria-label="Search products" />
          <button type="submit" aria-label="Submit search"><i className="fas fa-search" /></button>
        </form>
        <div className="aisle-header-actions">
          <Link href="/cart" aria-label={`Cart with ${cartCount} items`}><i className="fas fa-basket-shopping" />{cartCount > 0 && <b>{cartCount}</b>}</Link>
          {userName ? (
            <>
              <Link href="/account/dashboard" title={userName}><i className="far fa-user" /></Link>
              <button type="button" onClick={logout} aria-label="Sign out"><i className="fas fa-arrow-right-from-bracket" /></button>
            </>
          ) : <Link className="aisle-sign-in" href="/login">Sign in</Link>}
          <Link className="aisle-merchant-link" href="/merchant/login">Merchant</Link>
        </div>
      </div>
    </header>
  );
}
