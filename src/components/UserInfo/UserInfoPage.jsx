import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { useUserStore } from '../../stores/userStore';
import { MagitekChassis } from '../layout/MagitekChassis';
import { AvatarSection } from './AvatarSection';
import { RadarChartSection } from './RadarChartSection';
import { ProfileFormSection } from './ProfileFormSection';
import { SettingsModals } from './SettingsModals';

import hudTopBar from '../../assets/images/magitek/hud-top-bar.png';
import sideRail from '../../assets/images/magitek/exoskeleton-side-rail.png';

import styles from '../../styles/modules/UserInfoPage.module.css';

/**
 * UserInfoPage (Slice B)
 * Magitek Three-Layer Chassis:
 * - Background: transparent (global starfield shows through)
 * - ScrollContent: radar + profile form
 * - Foreground: HUD top bar + side rails
 */
export const UserInfoPage = () => {
  const userProfile = useUserStore((s) => s.userProfile);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);

  // Navigation immunity
  useRouteCleanup('user-info');

  const foreground = (
    <div className={styles.foregroundRoot} aria-hidden="true">
      {/* Side rails */}
      <div
        className={`${styles.sideRail} ${styles.sideRailLeft}`}
        style={{ backgroundImage: `url(${sideRail})` }}
      />
      <div
        className={`${styles.sideRail} ${styles.sideRailRight}`}
        style={{ backgroundImage: `url(${sideRail})` }}
      />

      {/* Top HUD (image above, avatar behind window) */}
      <div className={styles.hudTop}>
        <div className={styles.hudAvatarBehind}>
          <AvatarSection variant="hud" />
        </div>

        <div className={styles.hudTopBarImage} style={{ backgroundImage: `url(${hudTopBar})` }} />

        {/* Interactive buttons (pointer-events enabled) */}
        <div className={styles.hudButtons}>
          <button
            type="button"
            className={styles.hudButton}
            onClick={() => {
              // Temporary hash navigation (matches AppRoutes)
              window.location.hash = '#history';
            }}
            aria-label="前往歷史紀錄"
            title="歷史"
          >
            ⏱️
          </button>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <MagitekChassis foreground={foreground}>
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
      <MagitekChassis foreground={foreground}>
        <div className={styles.pageState}>
          <div className={styles.loadingCard}>
            <p>請先登入以查看個人資料</p>
          </div>
        </div>
      </MagitekChassis>
    );
  }

  return (
    <MagitekChassis foreground={foreground}>
      <div className={styles.scrollRoot}>
        {/* Spacer so the scroll content sits behind the HUD bar physically */}
        <div className={styles.hudSpacer} />

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

