import { useCallback } from 'react';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import styles from '../../styles/modules/ConsolePages.module.css';

/**
 * Tools (時空計畫)
 * V6 Spec: Tools / Utilities surface.
 */
export default function ToolsPage() {
  useRouteCleanup('tools');

  const go = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return (
    <MagitekChassis>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kicker}>Space-Time Project</div>
          <h1 className={styles.title}>時空計畫</h1>
          <p className={styles.subtitle}>工具 / 計算器 / 輔助功能</p>
        </header>

        <div className={styles.shell}>
          <div className={styles.grid}>
            <button type="button" className={styles.cardBtn} onClick={() => go('#evaluation/1rm')}>
              <div className={styles.cardTitle}>🏋️ 1RM 計算</div>
              <div className={styles.cardText}>估算單次最大重量</div>
            </button>

            <button type="button" className={styles.cardBtn} onClick={() => go('#evaluation/plates')}>
              <div className={styles.cardTitle}>🧱 Plates 配重</div>
              <div className={styles.cardText}>每邊槓片配置建議</div>
            </button>
          </div>

          <div className={styles.hint}>
            目前工具內容由 `EvaluationHub` 承載（`#evaluation/*`）。之後可把更多工具集中到此頁。
          </div>
        </div>
      </div>
    </MagitekChassis>
  );
}

