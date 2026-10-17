'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import AccountSidebar from '../../components/AccountSidebar';
import { backendUrl } from '../../lib/backend';
import { getAuthenticatedSession } from '../../lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const session = await getAuthenticatedSession('customer');
      if (!session) {
        router.replace('/login');
        return;
      }
      if (active) {
        setName(session.profile.name || '');
        setEmail(session.profile.email || '');
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [router]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const session = await getAuthenticatedSession('customer');
      if (!session) {
        router.replace('/login');
        return;
      }
      const response = await fetch(`${backendUrl}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Profile could not be updated.');
      setName(name.trim());
      setMessage('Profile updated.');
      window.dispatchEvent(new Event('authChanged'));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profile could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-content bg-light">
        <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: 'url(/images/background/bg1.jpg)' }}>
          <div className="container"><div className="dz-bnr-inr-entry">
            <h1>My Profile</h1>
            <nav aria-label="breadcrumb" className="breadcrumb-row"><ul className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/">Home</Link></li>
              <li className="breadcrumb-item"><Link href="/account/dashboard">Account</Link></li>
              <li className="breadcrumb-item">Profile</li>
            </ul></nav>
          </div></div>
        </div>

        <div className="content-inner-1"><div className="container"><div className="row">
          <AccountSidebar userName={name} userEmail={email} />
          <div className="col-xl-9 account-wrapper"><div className="account-card">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
            ) : (
              <form onSubmit={save}>
                <h5 className="mb-4">Account details</h5>
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="profile-name">Full name *</label>
                    <input id="profile-name" className="form-control" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="profile-email">Email</label>
                    <input id="profile-email" className="form-control" value={email} disabled />
                    <small className="text-muted">Email changes are disabled in this prototype.</small>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-secondary" type="submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div></div>
        </div></div></div>
      </div>
    </>
  );
}
