'use client';

import { useEffect } from 'react';

export default function AuthCallback() {

  useEffect(() => {
    // The Supabase JS client relies on the URL hash or query params
    // to complete the PKCE or implicit flow. 
    // By redirecting to the root, the store's onAuthStateChange listener
    // on the main page will handle the session creation automatically.
    // (Note: window.location.hash is preserved across client-side router pushes,
    // but a hard window.location.href replace might be safer to ensure
    // the hash stays intact if we want the home page to process it).
    
    // Actually, it's safest to just redirect preserving everything:
    window.location.href = '/' + window.location.hash + window.location.search;
  }, []);

  return null;
}
