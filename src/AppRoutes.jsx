import { useCallback, useEffect, useMemo, useState } from 'react';
import StrengthPage from './components/Strength/StrengthPage';
import CardioPage from './components/Assessment/Cardio/CardioPage';
import MusclePage from './components/Assessment/Muscle/MusclePage';
import FFMIPage from './components/Assessment/FFMI/FFMIPage';
import PowerPage from './components/Assessment/Power/PowerPage';
import HistoryPage from './components/History/HistoryPage';
import Ladder from './components/Ladder/Ladder';
import UserInfo from './components/UserInfo/UserInfo';
import styles from './styles/modules/TempNav.module.css';

/**
 * AppRoutes
 * Authenticated-only routing surface.
 *
 * Phase 4.x note:
 * We are not using react-router yet; this file provides a stable
 * abstraction point so we can expand routing later without touching App.
 */
export const AppRoutes = () => {
  const routes = useMemo(
    () => [
      { key: 'strength', label: '💪 力量', element: <StrengthPage /> },
      { key: 'cardio', label: '🫀 心肺', element: <CardioPage /> },
      { key: 'muscle', label: '🧬 肌肉', element: <MusclePage /> },
      { key: 'ffmi', label: '🧪 FFMI', element: <FFMIPage /> },
      { key: 'power', label: '⚡ 爆發', element: <PowerPage /> },
      { key: 'history', label: '🗂️ 歷史', element: <HistoryPage /> },
      { key: 'ladder', label: '🏆 排行', element: <Ladder /> },
      { key: 'user', label: '👤 個人', element: <UserInfo /> },
    ],
    []
  );

  const routeMap = useMemo(() => {
    const m = new Map();
    routes.forEach((r) => m.set(r.key, r));
    return m;
  }, [routes]);

  const getRouteFromHash = useCallback(() => {
    const raw = window.location.hash || '';
    const key = raw.replace('#', '').trim();
    return routeMap.has(key) ? key : 'strength';
  }, [routeMap]);

  const [activeRoute, setActiveRoute] = useState(() => getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setActiveRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [getRouteFromHash]);

  const navigate = useCallback((key) => {
    if (!routeMap.has(key)) return;
    window.location.hash = `#${key}`;
    setActiveRoute(key);
  }, [routeMap]);

  const current = routeMap.get(activeRoute) || routeMap.get('strength');

  return (
    <>
      {current?.element || <StrengthPage />}

      {/* Temporary navigation dock */}
      <div className={styles.dock} aria-label="temporary-navigation">
        <div className={styles.dockInner}>
          {routes.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`${styles.navBtn} ${activeRoute === r.key ? styles.navBtnActive : ''}`}
              onClick={() => navigate(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default AppRoutes;
