/**
 * Utility to resolve the API Base URL dynamically.
 * Helps fallback to the active Google Cloud Run backend in case the frontend is deployed
 * independently to static hosts like Vercel (e.g., mylyynk.vercel.app), Netlify, or GitHub Pages.
 */
export function getApiUrl(endpoint: string): string {
  // Prepend a leading slash if missing
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // 1. Check if user configured an explicit override in localStorage for debugging
  const localOverride = localStorage.getItem("mylynk_api_url");
  if (localOverride) {
    const base = localOverride.endsWith("/") ? localOverride.slice(0, -1) : localOverride;
    return `${base}${cleanEndpoint}`;
  }

  // 2. Check build-time environment variable VITE_API_BASE_URL
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envBase) {
    const base = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
    return `${base}${cleanEndpoint}`;
  }

  // 3. Dynamic auto-detection fallback for Vercel/Netlify hosting
  const host = window.location.hostname;
  if (
    host.includes("vercel.app") || 
    host.includes("netlify.app") || 
    host.includes("github.io") || 
    host === "mylyynk.vercel.app"
  ) {
    // Automatically routes to our active cloud container running the Express and Firestore database engine!
    return `https://ais-pre-gjkv2yier2neqfualfdnwd-85231211442.asia-east1.run.app${cleanEndpoint}`;
  }

  // Default to relative paths (local development server or integrated deployment container)
  return cleanEndpoint;
}
