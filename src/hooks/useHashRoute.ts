import { useCallback, useEffect, useState } from 'react';

export const ROUTES = ['today', 'practice', 'history', 'settings'] as const;
export type Route = (typeof ROUTES)[number];

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(hash) ? (hash as Route) : 'today';
}

export function useHashRoute(): { route: Route; navigate: (route: Route) => void } {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    if (window.location.hash === `#/${next}`) {
      setRoute(next);
      return;
    }
    window.location.hash = `#/${next}`;
  }, []);

  return { route, navigate };
}
