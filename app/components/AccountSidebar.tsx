'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AccountSidebarProps {
  userName?: string;
  userEmail?: string;
}

export default function AccountSidebar({ userName, userEmail }: AccountSidebarProps) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(userName || 'User');
  const [displayEmail, setDisplayEmail] = useState(userEmail || 'user@example.com');

  useEffect(() => {
    // Only talk to the Python backend if it's configured. In the demo it isn't
    // running, so we skip the call entirely (avoids a "Failed to fetch" error).
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backend || userName) return;

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${backend}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDisplayName(data.name || data.email || 'User');
          setDisplayEmail(data.email || 'user@example.com');
        }
      } catch {
        /* non-critical */
      }
    };
    fetchUserInfo();
  }, [userName]);

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="col-xl-3">
      <div className="toggle-info">
        <h5 className="title mb-0">Account Navbar</h5>
        <a className="toggle-btn" href="#accountSidebar">Account Menu</a>
      </div>
      <div className="sticky-top account-sidebar-wrapper">
        <div className="account-sidebar" id="accountSidebar">
          <div className="profile-head">
            <div className="user-thumb">
              <img className="rounded-circle" src="/images/profile4.jpg" alt={displayName} />
            </div>
            <h5 className="title mb-0">{displayName}</h5>
            <span className="text text-primary">{displayEmail}</span>
          </div>
          <div className="account-nav">
            <div className="nav-title bg-light">DASHBOARD</div>
            <ul>
              <li>
                <Link
                  href="/account/dashboard"
                  className={isActive('/account/dashboard') ? 'active' : ''}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className={isActive('/account/orders') ? 'active' : ''}
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/cart-pilot">
                  Cart Pilot
                </Link>
              </li>
            </ul>
            <div className="nav-title bg-light">ACCOUNT SETTINGS</div>
            <ul className="account-info-list">
              <li>
                <Link href="/account/profile">Profile</Link>
              </li>
              <li>
                <Link href="/account/address">Address</Link>
              </li>
              <li>
                <Link href="/account/payment-methods">Payment Methods</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
