import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Automatically inject the Supabase JWT token into request headers
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.set('Authorization', `Bearer ${session.access_token}`);
      }
    } catch (e) {
      console.warn("Could not retrieve Supabase session for API authentication header:", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
