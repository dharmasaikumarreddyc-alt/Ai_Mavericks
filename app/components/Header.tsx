'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { optionalBackendUrl } from '../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../lib/auth';

export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState('');
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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
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

  const logout = () => {
    clearAuthenticatedToken('customer');
    setUserName('');
    setCartCount(0);
    setProfileOpen(false);
    window.dispatchEvent(new Event('authChanged'));
    router.replace('/');
  };

  return (
    <header className="site-header mo-left header style-2" style={{ marginBottom: 0, paddingBottom: 0 }}>
      <div className="sticky-header main-bar-wraper navbar-expand-lg">
        <div className="main-bar clearfix">
          <div className="container clearfix d-flex align-items-center justify-content-between">
            <div className="logo-header logo-dark mb-0">
              <Link href="/" aria-label="Loopora home">
                <img src="/images/logo.svg" alt="Loopora" />
              </Link>
            </div>

            <div className="extra-nav d-flex ms-auto">
              <div className="extra-cell">
                <ul className="navbar-nav header-right m-0 flex-row align-items-center">
                  <li className="nav-item">
                    <Link className="nav-link" href="/shop" aria-label="Search products" title="Search products">
                      <i className="iconly-Light-Search" aria-hidden="true" />
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link className="nav-link" href="/cart-pilot" aria-label="Open CartPilot" title="CartPilot">
                      <i className="fas fa-microphone" aria-hidden="true" />
                    </Link>
                  </li>

                  <li className="nav-item position-relative">
                    <Link className="nav-link" href="/cart" aria-label={`Cart with ${cartCount} items`} title="Cart">
                      <i className="flaticon flaticon-shopping-cart" aria-hidden="true" />
                      {cartCount > 0 && (
                        <span
                          className="badge rounded-pill bg-primary"
                          style={{ position: 'absolute', top: 0, right: 0, fontSize: '10px' }}
                        >
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </Link>
                  </li>

                  {userName ? (
                    <li className="nav-item position-relative" ref={profileRef}>
                      <button
                        type="button"
                        className="nav-link border-0 bg-transparent"
                        onClick={() => setProfileOpen((current) => !current)}
                        aria-label="Customer account"
                        aria-expanded={profileOpen}
                        title="Customer account"
                      >
                        <i className="far fa-user" aria-hidden="true" />
                      </button>
                      {profileOpen && (
                        <div
                          className="dropdown-menu show"
                          style={{ right: 0, left: 'auto', minWidth: '210px', marginTop: '8px' }}
                        >
                          <span className="dropdown-item-text fw-semibold text-truncate">{userName}</span>
                          <Link className="dropdown-item" href="/account/dashboard" onClick={() => setProfileOpen(false)}>My account</Link>
                          <Link className="dropdown-item" href="/account/orders" onClick={() => setProfileOpen(false)}>Orders</Link>
                          <button className="dropdown-item" type="button" onClick={logout}>Sign out</button>
                        </div>
                      )}
                    </li>
                  ) : (
                    <li className="nav-item">
                      <Link className="nav-link" href="/login" aria-label="Customer login" title="Customer login">
                        <i className="far fa-user" aria-hidden="true" />
                      </Link>
                    </li>
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
