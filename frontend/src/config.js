// API_BASE_URL is dynamically determined based on the environment.
// We strip the trailing slash to ensure fetch calls don't end up with double slashes.
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
