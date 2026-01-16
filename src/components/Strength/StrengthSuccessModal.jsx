import PropTypes from 'prop-types';
import styles from '../../styles/modules/StrengthSuccessModal.module.css';

/**
 * Strength Success Modal Component
 * Displays success message after submitting strength test
 * Part of Phase 4.2 Rebirth Migration
 */
function StrengthSuccessModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>✅ 提交成功！</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>您的力量測試結果已成功保存！</p>
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

StrengthSuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StrengthSuccessModal;
