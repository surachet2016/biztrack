import { useState, useEffect } from 'react';
import { subscribeAuth } from '../lib/auth-store.js';

export function useAuth() {
  const [state, setState] = useState({ user: null, profile: null, subscription: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((s) => {
      setState(s);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { ...state, loading };
}
