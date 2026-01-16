import { formatScore } from '../../utils/formatScore';
import styles from '../../styles/modules/LadderNotification.module.css';

/**
 * Ladder Notification Component
 * Displays rank update notifications
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const LadderNotification = ({ 
  notificationData, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !notificationData) {
    return null;
  }

  const { type, isFirstTime, oldScore, newScore, oldRank, newRank } = notificationData;

  return (
    <div 
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="排名更新通知"
    >
      <div 
        className={`${styles.notification} ${styles[type || (isFirstTime ? 'firstTime' : 'declined')]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="關閉"
        >
          ×
        </button>

        {isFirstTime ? (
          <div className={styles.content}>
            <div className={styles.icon}>🎉</div>
            <h2 className={styles.title}>首次上榜！</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>戰鬥力</span>
                <span className={styles.statValue}>
                  {formatScore(newScore)}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>排名</span>
                <span className={styles.statValue}>
                  第 {newRank} 名
                </span>
              </div>
            </div>
            <p className={styles.message}>
              恭喜您首次進入排行榜！繼續努力提升您的戰鬥力吧！
            </p>
            <button
              className={styles.button}
              onClick={onClose}
            >
              知道了
            </button>
          </div>
        ) : type === 'improved' ? (
          <div className={styles.content}>
            <div className={styles.icon}>📈</div>
            <h2 className={styles.title}>排名提升！</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>戰鬥力</span>
                <div className={styles.statChange}>
                  <span className={styles.statOld}>
                    {formatScore(oldScore)}
                  </span>
                  <span className={styles.statArrow}>→</span>
                  <span className={styles.statNew}>
                    {formatScore(newScore)}
                  </span>
                  {newScore > oldScore && (
                    <span className={styles.statImprovement}>
                      (+{formatScore(newScore - oldScore)})
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>排名</span>
                <div className={styles.statChange}>
                  <span className={styles.statOld}>
                    {oldRank > 0 ? `第 ${oldRank} 名` : '未上榜'}
                  </span>
                  <span className={styles.statArrow}>→</span>
                  <span className={styles.statNew}>
                    第 {newRank} 名
                  </span>
                  {oldRank > 0 && newRank < oldRank && (
                    <span className={styles.statImprovement}>
                      (提升 {oldRank - newRank} 名)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              className={styles.button}
              onClick={onClose}
            >
              繼續努力
            </button>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.icon}>💪</div>
            <h2 className={styles.title}>排名更新</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>戰鬥力</span>
                <div className={styles.statChange}>
                  <span className={styles.statOld}>
                    {formatScore(oldScore)}
                  </span>
                  <span className={styles.statArrow}>→</span>
                  <span className={styles.statNew}>
                    {formatScore(newScore)}
                  </span>
                  {newScore < oldScore && (
                    <span className={styles.statDecline}>
                      (-{formatScore(oldScore - newScore)})
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>排名</span>
                <div className={styles.statChange}>
                  <span className={styles.statOld}>
                    {oldRank > 0 ? `第 ${oldRank} 名` : '未上榜'}
                  </span>
                  <span className={styles.statArrow}>→</span>
                  <span className={styles.statNew}>
                    第 {newRank} 名
                  </span>
                  {oldRank > 0 && newRank > oldRank && (
                    <span className={styles.statDecline}>
                      (下降 {newRank - oldRank} 名)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className={styles.message}>
              繼續努力，下次會更好！
            </p>
            <button
              className={styles.button}
              onClick={onClose}
            >
              知道了
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LadderNotification;
