'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { backendUrl } from '../lib/backend';
import { saveAuthenticatedToken, type AuthProfile } from '../lib/auth';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/auth/login/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();
        const profile: AuthProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          merchant_id: data.merchant_id,
        };
        if (!profile.id || !profile.email || !['customer', 'merchant'].includes(profile.role)) {
          throw new Error('Could not load your account profile.');
        }
        if (profile.role === 'merchant' && profile.merchant_id) {
          saveAuthenticatedToken('merchant', data.access_token, profile);
          window.dispatchEvent(new Event('authChanged'));
          router.replace(`/merchant/dashboard/${encodeURIComponent(profile.merchant_id)}`);
          return;
        }
        saveAuthenticatedToken('customer', data.access_token, profile);

        // Notify other components that auth state changed
        window.dispatchEvent(new Event('authChanged'));

        router.replace('/shop');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-area">
      <h2 className="text-secondary text-center">Customer Login</h2>
      <p className="text-center m-b25">Sign in to your customer account to shop and manage orders.</p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="m-b30">
          <label className="label-title">Email Address</label>
          <input
            name="email"
            required
            className="form-control"
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="m-b15">
          <label className="label-title">Password</label>
          <div className="secure-input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="form-control dz-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="show-pass" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
              <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </div>
          </div>
        </div>
        <p className="small text-muted m-b30">
          Password reset is not enabled in this prototype. Do not reuse a personal password.
        </p>
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-secondary btnhover text-uppercase me-2 sign-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <Link href="/register" className="btn btn-outline-secondary btnhover text-uppercase">
            Register
          </Link>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        Run a restaurant? <Link href="/merchant/login" className="text-primary">Merchant sign in</Link>
      </p>
    </div>
  );
}
