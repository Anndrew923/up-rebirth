import styles from '../../styles/modules/LadderPagination.module.css';

/**
 * Ladder Pagination Component
 * Handles page navigation for ladder list
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const LadderPagination = ({
  currentPage,
  totalPages,
  totalUsers,
  onPageChange,
  onPageSelect
}) => {
  if (totalPages < 1 || totalUsers === 0) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelect = (e) => {
    const selectedPage = parseInt(e.target.value, 10);
    if (selectedPage && selectedPage >= 1 && selectedPage <= totalPages) {
      onPageSelect(selectedPage);
    }
  };

  return (
    <div className={styles.pagination}>
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className={`${styles.button} ${styles.buttonPrev}`}
        aria-label="上一頁"
      >
        <span className={styles.arrow}>←</span>
      </button>

      <div className={styles.selectWrapper}>
        <select
          value={currentPage}
          onChange={handleSelect}
          className={styles.select}
          aria-label="選擇頁面"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              第 {page} 頁
            </option>
          ))}
        </select>
        <span className={styles.total}>
          / 共 {totalPages} 頁
        </span>
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`${styles.button} ${styles.buttonNext}`}
        aria-label="下一頁"
      >
        <span className={styles.arrow}>→</span>
      </button>
    </div>
  );
};

export default LadderPagination;
