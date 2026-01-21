import { t } from '../../i18n';
import styles from '../../styles/modules/AssessmentEntrySection.module.css';

/**
 * AssessmentEntrySection
 * Dedicated, responsive entry grid for assessment destinations.
 */
export function AssessmentEntrySection({
  onOpenStrength,
  onOpenCardio,
  onOpenMuscle,
  onOpenFFMI,
  onOpenExplosive,
}) {
  return (
    <section className={styles.group} aria-label="assessment-entries">
      <div className={styles.groupTitle}>測試入口</div>
      <div className={styles.grid}>
        <button type="button" className={styles.entryBtn} onClick={onOpenStrength}>
          💪 {t('assessment.strength', '力量測試')}
        </button>
        <button type="button" className={styles.entryBtn} onClick={onOpenCardio}>
          🫀 {t('assessment.cardio', '心肺測試')}
        </button>
        <button type="button" className={styles.entryBtn} onClick={onOpenMuscle}>
          🧬 {t('assessment.muscle', '肌肉測試')}
        </button>
        <button type="button" className={styles.entryBtn} onClick={onOpenFFMI}>
          🧪 {t('assessment.ffmi', 'FFMI 測試')}
        </button>
        <button type="button" className={styles.entryBtn} onClick={onOpenExplosive}>
          ⚡ {t('assessment.explosive', '爆發力測試')}
        </button>
      </div>
    </section>
  );
}

export default AssessmentEntrySection;

