import { useCallback } from 'react';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import styles from '../../styles/modules/ConsolePages.module.css';

/**
 * Settings (核心調律)
 * Placeholder for configuration surface.
 */
export default function SettingsPage() {
  useRouteCleanup('settings');

  const go = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return (
    <MagitekChassis>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kicker}>Core Tuning</div>
          <h1 className={styles.title}>核心調律</h1>
          <p className={styles.subtitle}>設定 / 配置（V6 規格預留）</p>
        </header>

        <div className={styles.shell}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>設定入口已接上</div>
            <div className={styles.cardText}>
              目前設定相關 UI 仍在既有模組中（例如個人頁的設定彈窗）。這個頁面先作為 V6 的正式路由落點。
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryBtn} onClick={() => go('#home')}>
                返回主控台
              </button>
            </div>
          </div>
        </div>
      </div>
    </MagitekChassis>
  );
}

