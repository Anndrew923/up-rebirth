import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { useUserStore } from '../../stores/userStore';
import { MagitekChassis } from '../layout/MagitekChassis';
import { RadarChartSection } from './RadarChartSection';
import { UserFormSection } from './UserFormSection';

import styles from '../../styles/modules/UserInfoPage.module.css';

/**
 * UserInfoPage (Slice B)
 * Magitek Three-Layer Chassis:
 * - Background: transparent (global starfield shows through)
 * - ScrollContent: radar + profile form
 * - Foreground: handled globally by MagitekChassis (Crown + rails + pedestal)
 */
export const UserInfoPage = () => {
  const userProfile = useUserStore((s) => s.userProfile);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);

  // Navigation immunity
  useRouteCleanup('user-info');

  // DEBUG / Force Render:
  // We intentionally DO NOT early-return on loading/auth here.
  // Objective: confirm raw form inputs are mounted inside MagitekChassis -> .scrollInnerView.
  const showDebugGate = isLoading || !isAuthenticated || !userProfile;

  return (
    <MagitekChassis>
      <div className={styles.scrollRoot}>
        <div className={styles.contentShell}>
          {showDebugGate && (
            <div className={styles.loadingCard} role="alert">
              <p style={{ margin: 0 }}>
                DEBUG：強制渲染表單中（isLoading={String(isLoading)} / isAuthenticated={String(isAuthenticated)} / hasProfile=
                {String(Boolean(userProfile))}）
              </p>
            </div>
          )}

          <RadarChartSection loading={Boolean(isLoading)} />
          {/* Force-mount form directly (Search & Rescue) */}
          <UserFormSection />
        </div>
      </div>
    </MagitekChassis>
  );
};

export default UserInfoPage;

