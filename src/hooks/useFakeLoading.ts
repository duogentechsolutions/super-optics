import { useEffect, useState } from 'react';

/** Brief simulated fetch so skeleton states are part of the demo. */
export function useFakeLoading(ms = 450, key?: unknown): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms, key]);
  return loading;
}
