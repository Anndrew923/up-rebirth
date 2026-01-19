import { useCallback, useEffect, useMemo, useState } from 'react';
import HomePage from './components/Home/HomePage';
import EvaluationHub from './components/EvaluationHub/EvaluationHub';
import StrengthPage from './components/Strength/StrengthPage';
import CardioPage from './components/Assessment/Cardio/CardioPage';
import MusclePage from './components/Assessment/Muscle/MusclePage';
import FFMIPage from './components/Assessment/FFMI/FFMIPage';
import PowerPage from './components/Assessment/Power/PowerPage';
import HistoryPage from './components/History/HistoryPage';
import Ladder from './components/Ladder/Ladder';
import ToolsPage from './components/Tools/ToolsPage';
import SettingsPage from './components/Settings/SettingsPage';
import HonorPage from './components/Honor/HonorPage';
import CommunityPage from './components/Community/CommunityPage';

/**
 * AppRoutes
 * Authenticated-only routing surface.
 *
 * Phase 4.x note:
 * We are not using react-router yet; this file provides a stable
 * abstraction point so we can expand routing later without touching App.
 */
export const AppRoutes = () => {
  /**
   * Routing model (Phase 4.x)
   * - Hash routing without react-router
   * - Supports subpaths via `#key/subpath` for hub-style navigation
   *   e.g. `#evaluation/1rm`, `#evaluation/plates`
   */
  const routes = useMemo(
    () => [
      // Core consoles
      { key: 'home', label: '🏠 主控台', Component: HomePage },
      { key: 'evaluation', label: '🧭 訓練場', Component: EvaluationHub },
      { key: 'ladder', label: '🏆 天梯', Component: Ladder },

      // Assessment pages (kept routable, but not in legacy footer)
      { key: 'strength', label: '💪 力量', Component: StrengthPage },
      { key: 'cardio', label: '🫀 心肺', Component: CardioPage },
      { key: 'muscle', label: '🧬 肌肉', Component: MusclePage },
      { key: 'ffmi', label: '🧪 FFMI', Component: FFMIPage },
      { key: 'power', label: '⚡ 爆發', Component: PowerPage },

      // Side-rail destinations (V6)
      { key: 'history', label: '⏱️ 時光迴廊', Component: HistoryPage },
      { key: 'community', label: '💬 靈魂共鳴', Component: CommunityPage },
      { key: 'tools', label: '🧰 時空計畫', Component: ToolsPage },
      { key: 'settings', label: '⚙️ 核心調律', Component: SettingsPage },
      { key: 'honor', label: '🏅 榮耀徽章', Component: HonorPage },
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
    const cleaned = raw.replace('#', '').trim();
    if (!cleaned) return { key: 'home', subPath: '' };

    const [keyRaw, ...rest] = cleaned.split('/');
    const key = (keyRaw || '').trim();
    const subPath = rest.join('/').trim();

    return routeMap.has(key) ? { key, subPath } : { key: 'home', subPath: '' };
  }, [routeMap]);

  const [activeRoute, setActiveRoute] = useState(() => getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setActiveRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [getRouteFromHash]);

  const current = routeMap.get(activeRoute.key) || routeMap.get('home');
  const CurrentComponent = current?.Component || StrengthPage;

  return (
    <>
      <CurrentComponent subPath={activeRoute.subPath} />
    </>
  );
};

export default AppRoutes;
