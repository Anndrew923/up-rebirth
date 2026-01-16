import { useMemo } from 'react';
import { useUserStore } from '../../stores/userStore';
import { formatScore } from '../../utils/formatScore';
import { getAgeGroup } from '../../utils/formatScore';
import styles from '../../styles/modules/LadderFloatingRank.module.css';

/**
 * Ladder Floating Rank Component
 * Displays user's current rank in a floating card
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const LadderFloatingRank = ({ 
  userRank, 
  onJumpToUser,
  selectedDivision,
  filterProject 
}) => {
  const userProfile = useUserStore((state) => state.userProfile);
  const stats = useUserStore((state) => state.stats);

  // Get display metrics based on division and project
  const getDisplayMetrics = useMemo(() => {
    if (!stats) {
      return { value: 0, unit: '', label: '', formatValue: (val) => val };
    }

    switch (selectedDivision) {
      case 'stats_totalLoginDays':
        return {
          value: stats.totalLoginDays || 0,
          unit: '天',
          label: '總登入天數',
          formatValue: (val) => Math.floor(val).toLocaleString('zh-TW'),
        };
      case 'stats_sbdTotal':
        if (filterProject === 'total_five') {
          const fiveItemTotal = 
            (stats.sbdTotal || 0) + 
            (stats.ohp || 0) + 
            (stats.latPull || 0);
          return {
            value: fiveItemTotal,
            unit: 'kg',
            label: '五項總和',
            formatValue: (val) => Number(val).toFixed(1),
          };
        } else if (filterProject === 'squat') {
          return {
            value: stats.squat || 0,
            unit: 'kg',
            label: '深蹲',
            formatValue: (val) => Number(val).toFixed(1),
          };
        } else if (filterProject === 'bench') {
          return {
            value: stats.bench || 0,
            unit: 'kg',
            label: '臥推',
            formatValue: (val) => Number(val).toFixed(1),
          };
        } else if (filterProject === 'deadlift') {
          return {
            value: stats.deadlift || 0,
            unit: 'kg',
            label: '硬舉',
            formatValue: (val) => Number(val).toFixed(1),
          };
        }
        return {
          value: stats.sbdTotal || 0,
          unit: 'kg',
          label: '三項總和',
          formatValue: (val) => Number(val).toFixed(1),
        };
      case 'stats_bodyFat':
        if (filterProject === 'ffmi') {
          return {
            value: stats.ffmi || 0,
            unit: '',
            label: 'FFMI',
            formatValue: (val) => Number(val).toFixed(2),
          };
        }
        return {
          value: stats.bodyFat || 0,
          unit: '%',
          label: '體脂率',
          formatValue: (val) => Number(val).toFixed(1),
        };
      case 'stats_cooper':
        if (filterProject === '5km') {
          const format5KTime = (val) => {
            if (!val || val === 0) return '0:00';
            const minutes = Math.floor(val / 60);
            const seconds = Math.floor(val % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          };
          return {
            value: stats.run5kTime || stats.run5k || 0,
            unit: '分鐘',
            label: '5公里跑步',
            formatValue: format5KTime,
          };
        }
        return {
          value: stats.cooper || 0,
          unit: 'km',
          label: '庫柏測試',
          formatValue: (val) => (Number(val) / 1000).toFixed(2),
        };
      case 'stats_vertical':
        if (filterProject === 'broad') {
          return {
            value: stats.broad || 0,
            unit: 'cm',
            label: '立定跳遠',
            formatValue: (val) => Number(val).toFixed(1),
          };
        } else if (filterProject === 'sprint') {
          return {
            value: stats.run100m || 0,
            unit: '秒',
            label: '100公尺衝刺',
            formatValue: (val) => Number(val).toFixed(2),
          };
        }
        return {
          value: stats.vertical || 0,
          unit: 'cm',
          label: '垂直跳',
          formatValue: (val) => Number(val).toFixed(1),
        };
      case 'ladderScore':
      default:
        return {
          value: stats.ladderScore || 0,
          unit: '分',
          label: '戰鬥力',
          formatValue: (val) => formatScore(val),
        };
    }
  }, [stats, selectedDivision, filterProject]);

  // Get rank badge
  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    if (rank <= 50) return '⭐';
    return '';
  };

  // Don't show if conditions not met
  const shouldShow = useMemo(() => {
    if (!userProfile || !stats || !stats.ladderScore || stats.ladderScore === 0) {
      return false;
    }
    if (userRank > 0 && userRank <= 7) {
      return false; // Top 7 don't need floating rank
    }
    if (userRank === 0) {
      return false; // Not ranked
    }
    return true;
  }, [userProfile, stats, userRank]);

  if (!shouldShow) {
    return null;
  }

  const metrics = getDisplayMetrics;
  const rankBadge = getRankBadge(userRank);
  const displayName = userProfile?.displayName || userProfile?.email?.split('@')[0] || '未命名用戶';

  return (
    <div
      className={styles.floatingRank}
      data-rank={userRank}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onJumpToUser) {
          onJumpToUser();
        }
      }}
      title="點擊查看我的排名"
    >
      <div className={styles.rankCard}>
        <div className={styles.rank}>
          <span className={styles.rankNumber}>{userRank}</span>
          <span className={styles.rankBadge}>{rankBadge}</span>
        </div>

        <div className={styles.user}>
          <div className={styles.avatar}>
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="頭像"
                loading="lazy"
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {displayName}
              {userProfile?.emailVerified && (
                <span className={styles.verificationBadge} title="榮譽認證">
                  🏅
                </span>
              )}
            </div>
            <div className={styles.userDetails}>
              {stats?.ageGroup ? getAgeGroup(stats.ageGroup) : '未知'} •{' '}
              {stats?.gender === 'male' ? '男' : '女'}
              <br />
              <span className={styles.lastUpdate}>我的排名</span>
            </div>
          </div>
        </div>

        <div className={styles.score}>
          <span className={styles.scoreValue}>
            {metrics.formatValue(metrics.value)}
          </span>
          <span className={styles.scoreLabel}>{metrics.unit}</span>
        </div>
      </div>
    </div>
  );
};

export default LadderFloatingRank;
