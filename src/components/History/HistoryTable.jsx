import PropTypes from 'prop-types';
import styles from '../../styles/modules/HistoryTable.module.css';

/**
 * History Table Component
 * Displays history records in a table format
 * Part of Phase 4.3 Rebirth Migration
 */
export default function HistoryTable({
  currentRecords,
  startIndex,
  showAllColumns,
  showDeleteOptions,
  selectedRecords,
  getScoreClass,
  handleSelectRecord,
}) {
  return (
    <table className={styles.historyTable}>
      <thead>
        <tr>
          <th
            className={`${styles.dateCol} ${
              showAllColumns ? styles.mobileHidden : ''
            }`}
          >
            <span className={styles.icon}>📅</span>
            <span className={styles.desktopText}>
              日期
            </span>
          </th>
          <th className={styles.scoreCol}>
            <span className={styles.icon}>💪</span>
            <span className={styles.desktopText}>
              力量
            </span>
          </th>
          <th className={styles.scoreCol}>
            <span className={styles.icon}>⚡</span>
            <span className={styles.desktopText}>
              爆發力
            </span>
          </th>
          <th
            className={`${styles.scoreCol} ${
              !showAllColumns ? styles.mobileHidden : ''
            }`}
          >
            <span className={styles.icon}>❤️</span>
            <span className={styles.desktopText}>
              心肺
            </span>
          </th>
          <th
            className={`${styles.scoreCol} ${
              !showAllColumns ? styles.mobileHidden : ''
            }`}
          >
            <span className={styles.icon}>🥩</span>
            <span className={styles.desktopText}>
              肌肉量
            </span>
          </th>
          <th
            className={`${styles.scoreCol} ${
              !showAllColumns ? styles.mobileHidden : ''
            }`}
          >
            <span className={styles.icon}>📊</span>
            <span className={styles.desktopText}>
              體脂
            </span>
          </th>
          <th className={styles.averageCol}>
            <span className={styles.icon}>🏆</span>
            <span className={styles.desktopText}>
              總分
            </span>
          </th>
          {showDeleteOptions && (
            <th className={styles.selectCol}>選擇</th>
          )}
        </tr>
      </thead>
      <tbody>
        {currentRecords.map((record, index) => {
          const globalIndex = startIndex + index;
          const scores = record.scores || {};
          const avgScore =
            record.averageScore ||
            (
              Object.values(scores)
                .filter(s => s > 0)
                .reduce((sum, s) => sum + s, 0) /
              Object.values(scores).filter(s => s > 0).length
            ).toFixed(2) ||
            0;

          const recordDate = record.date || record.timestamp;
          const displayDate = recordDate
            ? new Date(recordDate).toLocaleDateString('zh-TW')
            : '';

          return (
            <tr key={record.id || globalIndex}>
              <td
                className={`${styles.dateCell} ${
                  showAllColumns ? styles.mobileHidden : ''
                }`}
              >
                {displayDate}
              </td>
              <td
                className={`${styles.scoreCell} ${getScoreClass(
                  scores.strength || 0
                )}`}
              >
                {(scores.strength || 0).toFixed(2)}
              </td>
              <td
                className={`${styles.scoreCell} ${getScoreClass(
                  scores.explosivePower || 0
                )}`}
              >
                {(scores.explosivePower || 0).toFixed(2)}
              </td>
              <td
                className={`${styles.scoreCell} ${
                  !showAllColumns ? styles.mobileHidden : ''
                } ${getScoreClass(scores.cardio || 0)}`}
              >
                {(scores.cardio || 0).toFixed(2)}
              </td>
              <td
                className={`${styles.scoreCell} ${
                  !showAllColumns ? styles.mobileHidden : ''
                } ${getScoreClass(scores.muscleMass || 0)}`}
              >
                {(scores.muscleMass || 0).toFixed(2)}
              </td>
              <td
                className={`${styles.scoreCell} ${
                  !showAllColumns ? styles.mobileHidden : ''
                } ${getScoreClass(scores.bodyFat || 0)}`}
              >
                {(scores.bodyFat || 0).toFixed(2)}
              </td>
              <td className={`${styles.averageCell} ${getScoreClass(avgScore)}`}>
                <strong>{Number(avgScore).toFixed(2)}</strong>
              </td>
              {showDeleteOptions && (
                <td className={styles.selectCell}>
                  <input
                    type="checkbox"
                    className={styles.historyCheckbox}
                    checked={selectedRecords.includes(globalIndex)}
                    onChange={() => handleSelectRecord(globalIndex)}
                  />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

HistoryTable.propTypes = {
  currentRecords: PropTypes.array.isRequired,
  startIndex: PropTypes.number.isRequired,
  showAllColumns: PropTypes.bool.isRequired,
  showDeleteOptions: PropTypes.bool.isRequired,
  selectedRecords: PropTypes.array.isRequired,
  getScoreClass: PropTypes.func.isRequired,
  handleSelectRecord: PropTypes.func.isRequired,
};
