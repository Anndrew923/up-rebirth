import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import styles from '../../styles/modules/ConsolePages.module.css';

/**
 * Community (靈魂共鳴)
 * Placeholder for V6 social/community surface.
 */
export default function CommunityPage() {
  useRouteCleanup('community');

  return (
    <MagitekChassis>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kicker}>Soul Resonance</div>
          <h1 className={styles.title}>靈魂共鳴</h1>
          <p className={styles.subtitle}>社群 / 互動功能（V6 規格預留）</p>
        </header>

        <div className={styles.shell}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>尚未啟用</div>
            <div className={styles.cardText}>
              這個節點已完成路由與導航植入，後續可在此加入社群、留言、組隊、挑戰等功能。
            </div>
          </div>
        </div>
      </div>
    </MagitekChassis>
  );
}

