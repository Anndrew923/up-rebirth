import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

/**
 * Navigation Defense Hook
 * Clears all overlays, modals, and loading states on route changes
 * Prevents "ghost masks" - UI elements that persist after navigation
 * 
 * Part of the Rebirth Manifesto: Navigation Immunity
 * 
 * @param {string} routeKey - A unique key that changes when route changes
 *                            Can be pathname, route ID, or any identifier
 */
export const useRouteCleanup = (routeKey) => {
  const clearAllOverlays = useUIStore((state) => state.clearAllOverlays);

  useEffect(() => {
    // Clear all overlays when route changes
    clearAllOverlays();
    
    // Optional: Return cleanup function if needed
    return () => {
      // Additional cleanup can be added here if necessary
    };
  }, [routeKey, clearAllOverlays]);
};

/**
 * Alternative hook that uses window.location.pathname
 * Automatically detects route changes
 */
export const useAutoRouteCleanup = () => {
  const clearAllOverlays = useUIStore((state) => state.clearAllOverlays);

  useEffect(() => {
    const handleRouteChange = () => {
      clearAllOverlays();
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Also clear on initial mount if needed
    clearAllOverlays();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [clearAllOverlays]);
};
