import PropTypes from 'prop-types';
import styles from '../../styles/modules/HonorUnlockModal.module.css';

/**
 * Honor Unlock Modal Component
 * Displays honor/unlock information for strength achievements
 * Part of Phase 4.2 Rebirth Migration
 */
function HonorUnlockModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🏆 成就解鎖</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.unlockInfo}>
            <p className={styles.exerciseName}>{data.exercise}</p>
            <p className={styles.scoreValue}>分數: {data.score}</p>
            <p className={styles.levelValue}>等級: {data.level}</p>
            {data.weight && (
              <p className={styles.weightValue}>重量: {data.weight} kg</p>
            )}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.confirmButton} onClick={onClose}>
            確定
          </button>
        </div>
      </div>
    </div>
  );
}

HonorUnlockModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
};

export default HonorUnlockModal;
