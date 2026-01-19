import PropTypes from 'prop-types';
import styles from '../../../styles/modules/AssessmentSuccessModal.module.css';

/**
 * Generic Success Modal for Assessment submissions.
 * Keeps UI consistent across Cardio/Muscle/FFMI/Power.
 */
export default function AssessmentSuccessModal({
  isOpen,
  onClose,
  title = '✅ 提交成功！',
  message = '您的測試結果已成功保存！',
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="close">
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
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

AssessmentSuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
};

