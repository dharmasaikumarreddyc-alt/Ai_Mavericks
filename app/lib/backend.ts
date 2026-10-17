const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const serverBackendUrl = (configuredBackendUrl || 'http://localhost:8000').replace(/\/+$/, '');

// Browser requests stay on the Loopora web origin and are rewritten by Next.js
// to the configured FastAPI service. This avoids brittle cross-origin auth/CORS
// failures when a Cloud Run frontend revision or URL changes.
export const backendUrl = typeof window === 'undefined' ? serverBackendUrl : '/backend';

// Keep this truthy in the browser when a backend is configured so UI elements
// such as cart counts still know the operational backend is available.
export const optionalBackendUrl = typeof window === 'undefined'
  ? (configuredBackendUrl ? serverBackendUrl : null)
  : (configuredBackendUrl ? '/backend' : null);
