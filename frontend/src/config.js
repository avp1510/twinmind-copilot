// API_BASE_URL is dynamically determined based on the environment.
// In production (Vercel), it uses the VITE_API_URL environment variable.
// In development, it falls back to localhost.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
