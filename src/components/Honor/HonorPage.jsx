import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import styles from '../../styles/modules/ConsolePages.module.css';

/**
 * Honor / Certification (榮耀徽章)
 * Placeholder for achievements/certification surface.
 */
export default function HonorPage() {
  useRouteCleanup('honor');

  return (
    <MagitekChassis>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kicker}>Honor Badge</div>
          <h1 className={styles.title}>榮耀徽章</h1>
          <p className={styles.subtitle}>認證 / 成就 / 解鎖（V6 規格預留）</p>
        </header>

        <div className={styles.shell}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>尚未啟用</div>
            <div className={styles.cardText}>
              這個節點已完成路由與導航植入。後續可以串接「驗證/榮耀」流程與成就系統。
            </div>
          </div>
        </div>
      </div>
    </MagitekChassis>
  );
}

