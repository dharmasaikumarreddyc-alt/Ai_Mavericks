import { backendUrl } from './backend';

export type AccountRole = 'customer' | 'merchant';

export interface AuthProfile {
  id: string;
  email: string;
  name?: string;
  role: AccountRole;
  merchant_id: string | null;
}

export interface AuthenticatedSession {
  token: string;
  profile: AuthProfile;
}

const tokenKeys: Record<AccountRole, string> = {
  customer: 'customerToken',
  merchant: 'merchantToken',
};

const profileKeys: Record<AccountRole, string> = {
  customer: 'aisleCustomerProfile',
  merchant: 'aisleMerchantProfile',
};

function cachedSession(role: AccountRole, token: string): AuthenticatedSession | null {
  try {
    const raw = sessionStorage.getItem(profileKeys[role]);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { token: string; profile: AuthProfile };
    if (cached.token !== token || cached.profile?.role !== role) return null;
    return cached;
  } catch {
    return null;
  }
}

export async function getAuthenticatedSession(role: AccountRole): Promise<AuthenticatedSession | null> {
  if (typeof window === 'undefined') return null;

  const storedToken = localStorage.getItem(tokenKeys[role]);
  if (!storedToken) return null;

  const cached = cachedSession(role, storedToken);
  if (cached) return cached;

  try {
    const response = await fetch(`${backendUrl}/auth/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    if (!response.ok) {
      for (const key of Object.values(tokenKeys)) {
        if (localStorage.getItem(key) === storedToken) localStorage.removeItem(key);
      }
      if (localStorage.getItem('token') === storedToken) localStorage.removeItem('token');
      return null;
    }

    const profile: AuthProfile = await response.json();
    if (profile.role !== 'customer' && profile.role !== 'merchant') return null;

    if (profile.role !== role) {
      clearAuthenticatedToken(role);
      return null;
    }

    const session = { token: storedToken, profile };
    sessionStorage.setItem(profileKeys[role], JSON.stringify(session));
    return session;
  } catch {
    return null;
  }
}

export function saveAuthenticatedToken(role: AccountRole, token: string, profile?: AuthProfile): void {
  const otherRole: AccountRole = role === 'customer' ? 'merchant' : 'customer';
  localStorage.setItem(tokenKeys[role], token);
  localStorage.removeItem(tokenKeys[otherRole]);
  localStorage.removeItem('token');
  sessionStorage.removeItem(profileKeys[otherRole]);
  if (profile?.role === role) {
    sessionStorage.setItem(profileKeys[role], JSON.stringify({ token, profile }));
  } else {
    sessionStorage.removeItem(profileKeys[role]);
  }
}

export function clearAuthenticatedToken(role: AccountRole): void {
  localStorage.removeItem(tokenKeys[role]);
  sessionStorage.removeItem(profileKeys[role]);
}

export function clearAllAuthenticatedTokens(): void {
  localStorage.removeItem(tokenKeys.customer);
  localStorage.removeItem(tokenKeys.merchant);
  localStorage.removeItem('token');
  sessionStorage.removeItem(profileKeys.customer);
  sessionStorage.removeItem(profileKeys.merchant);
}
