import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { useUserStore } from '../../stores/userStore';
import { AvatarSection } from './AvatarSection';
import { RadarChartSection } from './RadarChartSection';
import { UserFormSection } from './UserFormSection';
import { SettingsModals } from './SettingsModals';
import styles from '../../styles/modules/UserInfo.module.css';

/**
 * Main UserInfo Component
 * Rebuilt following Magitek 2.0 standards
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Replaces legacy UserInfo/index.jsx with modular architecture
 * 
 * Structure:
 * - AvatarSection: User avatar and basic info
 * - RadarChartSection: Fitness metrics visualization
 * - UserFormSection: Profile form with Zero-Trust validation
 * - SettingsModals: Privacy and notification settings
 */
export const UserInfo = () => {
  const userProfile = useUserStore((state) => state.userProfile);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isLoading = useUserStore((state) => state.isLoading);

  // Navigation defense - clear all modals/overlays on route change
  useRouteCleanup('userinfo');

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.userInfo}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated || !userProfile) {
    return (
      <div className={styles.userInfo}>
        <div className={styles.notAuthenticated}>
          <p>請先登入以查看個人資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.userInfo}>
      {/* Avatar Section */}
      <AvatarSection isGuest={false} />

      {/* Radar Chart Section */}
      <RadarChartSection loading={isLoading} />

      {/* User Form Section */}
      <UserFormSection />

      {/* Settings Modals */}
      <SettingsModals />
    </div>
  );
};

export default UserInfo;
