import { useState } from 'react';
import styles from '../../styles/modules/LadderList.module.css';

/**
 * Ladder List Component
 * Displays the list of ranked users
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Note: This is a simplified version. Full implementation would include
 * LadderItem components for each user entry.
 */
export const LadderList = ({
  ladderData = [],
  displayStartRank = 1,
  currentUserId,
  onUserClick,
  onToggleLike,
  likedUsers = [],
  likeProcessing = false,
  onRefresh,
  loading = false,
  displayMode = 'ladderScore',
  filterProject = 'total',
  scrollTrigger = 0
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  if (loading && ladderData.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (ladderData.length === 0) {
    return (
      <div className={styles.empty}>
        <p>暫無數據</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <div className={styles.listHeader}>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className={styles.items}>
        {ladderData.map((user, index) => {
          const rank = displayStartRank + index;
          const isCurrentUser = user.userId === currentUserId || user.id === currentUserId;
          
          return (
            <div
              key={user.id || user.userId || index}
              className={`${styles.item} ${isCurrentUser ? styles.currentUser : ''}`}
              onClick={() => onUserClick && onUserClick(user)}
            >
              <div className={styles.rank}>
                <span className={styles.rankNumber}>{rank}</span>
              </div>

              <div className={styles.user}>
                <div className={styles.avatar}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="頭像" loading="lazy" />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(user.nickname || user.displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {user.nickname || user.displayName || user.email?.split('@')[0] || '未命名用戶'}
                    {user.isVerified && <span className={styles.verificationBadge}>🏅</span>}
                  </div>
                  <div className={styles.userDetails}>
                    {user.ageGroup || '未知'} • {user.gender === 'male' ? '男' : '女'}
                  </div>
                </div>
              </div>

              <div className={styles.score}>
                <span className={styles.scoreValue}>
                  {displayMode === 'ladderScore' 
                    ? (user.ladderScore || 0).toLocaleString('zh-TW')
                    : (user.score || 0).toFixed(1)}
                </span>
                <span className={styles.scoreLabel}>
                  {displayMode === 'ladderScore' ? '分' : 'kg'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LadderList;
