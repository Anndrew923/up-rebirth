import styles from '../../styles/modules/StrengthStandardsTab.module.css';

/**
 * Strength Standards Tab Component
 * Displays strength standards/reference information
 * Part of Phase 4.2 Rebirth Migration
 */
function StrengthStandardsTab() {
  return (
    <div className={styles.standardsTab}>
      <h3 className={styles.standardsTitle}>力量標準參考</h3>
      <div className={styles.standardsContent}>
        <p>力量標準資訊將在此顯示</p>
        <p className={styles.standardsNote}>
          此功能正在開發中，將提供詳細的力量標準參考表
        </p>
      </div>
    </div>
  );
}

export default StrengthStandardsTab;
