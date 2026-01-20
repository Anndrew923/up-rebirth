import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import { RadarChartSection } from '../UserInfo/RadarChartSection';
import { UserFormSection } from '../UserInfo/UserFormSection';
import styles from '../../styles/modules/ConsolePages.module.css';

/**
 * HomePage (主控台)
 * V6 Spec: "Center Slot -> Home Page (Radar Chart view)"
 */
export default function HomePage() {
  useRouteCleanup('home');

  return (
    <MagitekChassis>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kicker}>Main Console</div>
          <h1 className={styles.title}>主控台</h1>
          <p className={styles.subtitle}>能力雷達圖總覽（Radar Chart view）</p>
        </header>

        <div className={styles.shell}>
          <RadarChartSection loading={false} />
          <UserFormSection />
        </div>
      </div>
    </MagitekChassis>
  );
}

