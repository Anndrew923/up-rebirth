import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { useUserStore } from '../../stores/userStore';
import { MagitekChassis } from '../layout/MagitekChassis';
import { RadarChartSection } from './RadarChartSection';
import { ProfileFormSection } from './ProfileFormSection';
import { SettingsModals } from './SettingsModals';

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

  // Loading state
  if (isLoading) {
    return (
      <MagitekChassis>
        <div className={styles.pageState}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p>載入中...</p>
          </div>
        </div>
      </MagitekChassis>
    );
  }

  if (!isAuthenticated || !userProfile) {
    return (
      <MagitekChassis>
        <div className={styles.pageState}>
          <div className={styles.loadingCard}>
            <p>請先登入以查看個人資料</p>
          </div>
        </div>
      </MagitekChassis>
    );
  }

  return (
    <MagitekChassis>
      <div className={styles.scrollRoot}>
        <div className={styles.contentShell}>
          <RadarChartSection loading={false} />
          <ProfileFormSection />
          <SettingsModals />
        </div>
      </div>
    </MagitekChassis>
  );
};

export default UserInfoPage;

