import { useEffect } from 'react';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import { useHistoryLogic } from './useHistoryLogic';
import HistoryTable from './HistoryTable';
import HistoryChart from './HistoryChart';
import styles from '../../styles/modules/HistoryPage.module.css';

/**
 * History Page Component
 * Main history display page
 * Part of Phase 4.3 Rebirth Migration
 * 
 * Migrated from legacy HistoryPage.jsx
 * - Wrapped in MagitekChassis
 * - Uses CSS Modules
 * - Integrated with useUserStore
 */
function HistoryPage() {
  const {
    sortedHistory,
    currentRecords,
    totalPages,
    currentPage,
    recordCount,
    maxRecords,
    isNearLimit,
    isAtLimit,
    showDeleteOptions,
    selectedRecords,
    showAllColumns,
    setShowAllColumns,
    selectedChartData,
    setSelectedChartData,
    chartData,
    getScoreClass,
    toggleDeleteOptions,
    handleSelectRecord,
    handleDeleteSelected,
    goToPage,
    startIndex,
    hasLoggedRef,
  } = useHistoryLogic();

  // Navigation defense
  useRouteCleanup('history');

  useEffect(() => {
    if (hasLoggedRef.current) return;
    console.debug('History.js - 記錄數量:', recordCount, '/', maxRecords);
    console.debug('History.js - 當前頁面:', currentPage, '/', totalPages);
    hasLoggedRef.current = true;
  }, [recordCount, currentPage, totalPages, maxRecords]);

  return (
    <MagitekChassis>
      <div className={styles.historyContainer}>
        <h1 className={styles.title}>歷史記錄</h1>

        <div className={styles.historyTableSection}>
          {sortedHistory.length > 0 ? (
            <>
              <div className={styles.scoreLegend}>
                <h4 className={styles.legendTitle}>分數圖例</h4>
                <div className={styles.legendItems}>
                  <span className={`${styles.legendItem} ${styles.scoreExcellent}`}>
                    優秀 (80+)
                  </span>
                  <span className={`${styles.legendItem} ${styles.scoreGood}`}>
                    良好 (60-79)
                  </span>
                  <span className={`${styles.legendItem} ${styles.scoreFair}`}>
                    普通 (40-59)
                  </span>
                  <span className={`${styles.legendItem} ${styles.scorePoor}`}>
                    待提升 (1-39)
                  </span>
                </div>
              </div>

              <HistoryTable
                currentRecords={currentRecords}
                startIndex={startIndex}
                showAllColumns={showAllColumns}
                showDeleteOptions={showDeleteOptions}
                selectedRecords={selectedRecords}
                getScoreClass={getScoreClass}
                handleSelectRecord={handleSelectRecord}
              />

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.paginationBtn}
                  >
                    上一頁
                  </button>
                  <span className={styles.pageInfo}>
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.paginationBtn}
                  >
                    下一頁
                  </button>
                </div>
              )}

              <div className={styles.actionButtons}>
                <button
                  onClick={() => setShowAllColumns(!showAllColumns)}
                  className={`${styles.toggleDeleteBtn} ${styles.mobileToggleBtn}`}
                >
                  {showAllColumns ? '顯示日期' : '顯示全部'}
                </button>
              </div>

              {sortedHistory.length > 0 && (
                <div className={styles.historyStats}>
                  <div className={styles.statsAndActions}>
                    <div className={styles.recordCount}>
                      <span className={styles.countLabel}>
                        記錄數量
                      </span>
                      <span
                        className={`${styles.countValue} ${
                          isNearLimit ? styles.nearLimit : ''
                        } ${isAtLimit ? styles.atLimit : ''}`}
                      >
                        {recordCount} / {maxRecords}
                      </span>
                    </div>

                    <div className={styles.actionButtons}>
                      <button
                        onClick={toggleDeleteOptions}
                        className={`${styles.toggleDeleteBtn} ${
                          showDeleteOptions
                            ? styles.cancelDeleteBtn
                            : styles.editModeBtn
                        }`}
                      >
                        {showDeleteOptions ? '取消' : '清除記錄'}
                      </button>
                      {showDeleteOptions && (
                        <button
                          onClick={handleDeleteSelected}
                          className={`${styles.toggleDeleteBtn} ${styles.deleteSelectedBtn}`}
                        >
                          刪除選中
                        </button>
                      )}
                    </div>
                  </div>

                  {isNearLimit && !isAtLimit && (
                    <div className={styles.limitWarning}>
                      記錄數量接近上限，建議清理舊記錄
                    </div>
                  )}

                  {isAtLimit && (
                    <div className={styles.limitError}>
                      記錄數量已達上限，請清理舊記錄
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noHistory}>
              <h3>尚無歷史記錄</h3>
              <p>完成測試後，您的記錄將顯示在這裡</p>
              <p>開始您的第一次測試吧！</p>
            </div>
          )}
        </div>

        {sortedHistory.length > 0 && (
          <HistoryChart
            chartData={chartData}
            selectedChartData={selectedChartData}
            setSelectedChartData={setSelectedChartData}
          />
        )}
      </div>
    </MagitekChassis>
  );
}

export default HistoryPage;
