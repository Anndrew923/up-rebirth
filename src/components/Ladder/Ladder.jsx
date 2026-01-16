import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useLadderFilters } from '../../hooks/useLadderFilters';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { LadderNotification } from './LadderNotification';
import { LadderFloatingRank } from './LadderFloatingRank';
import { LadderHeader } from './LadderHeader';
import { LadderList } from './LadderList';
import { LadderPagination } from './LadderPagination';
import styles from '../../styles/modules/Ladder.module.css';

/**
 * Main Ladder Component
 * Rebuilt following Magitek 2.0 standards
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Replaces legacy Ladder.jsx with modular architecture
 */
export const Ladder = () => {
  const userProfile = useUserStore((state) => state.userProfile);
  const stats = useUserStore((state) => state.stats);
  
  // Filter management
  const filters = useLadderFilters();
  
  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  
  // User context toggle
  const [showUserContext, setShowUserContext] = useState(false);
  
  // User card state
  const [showUserCard, setShowUserCard] = useState(false);
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);
  
  // Ladder data state (simplified - would be replaced with useLadder hook)
  const [ladderData, setLadderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [displayStartRank, setDisplayStartRank] = useState(1);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  // Route cleanup
  useRouteCleanup('ladder');

  // Check and show notification
  const checkAndShowNotification = useCallback((newRank) => {
    try {
      const savedNotification = localStorage.getItem('ladderUpdateNotification');
      if (!savedNotification) return;

      const notification = JSON.parse(savedNotification);
      if (notification.hasShown) return;

      const timeDiff = Date.now() - notification.timestamp;
      if (timeDiff > 5 * 60 * 1000) {
        localStorage.removeItem('ladderUpdateNotification');
        return;
      }

      notification.newRank = newRank;
      notification.oldRank = notification.oldRank || 0;

      const scoreImproved = notification.newScore > notification.oldScore;
      const rankImproved = notification.oldRank > 0 && notification.newRank < notification.oldRank;

      if (notification.isFirstTime) {
        notification.type = 'first-time';
      } else if (scoreImproved || rankImproved) {
        notification.type = 'improved';
      } else {
        notification.type = 'declined';
      }

      setNotificationData(notification);
      setShowNotification(true);

      notification.hasShown = true;
      localStorage.setItem('ladderUpdateNotification', JSON.stringify(notification));
    } catch (error) {
      console.error('檢查提醒框失敗:', error);
    }
  }, []);

  // Jump to current user
  const jumpToCurrentUser = useCallback(() => {
    if (!userProfile?.uid) return;
    if (userRank === 0) return;

    const usersPerPage = 50;
    const targetPage = Math.ceil(userRank / usersPerPage);

    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    } else {
      setScrollTrigger((prev) => prev + 1);
    }
  }, [userRank, currentPage, userProfile]);

  // Handle user click
  const handleUserClick = useCallback((user) => {
    if (user.isAnonymous) return;
    setSelectedUserForCard(user);
    setShowUserCard(true);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    // TODO: Implement actual refresh logic with useLadder hook
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const handlePageSelect = useCallback((page) => {
    handlePageChange(page);
  }, [handlePageChange]);

  // Close notification
  const handleCloseNotification = useCallback(() => {
    setShowNotification(false);
    localStorage.removeItem('ladderUpdateNotification');
  }, []);

  // Check notification when rank changes
  useEffect(() => {
    if (userRank > 0) {
      checkAndShowNotification(userRank);
    }
  }, [userRank, checkAndShowNotification]);

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return (
    <div className={styles.ladder}>
      {/* Notification */}
      <LadderNotification
        notificationData={notificationData}
        isOpen={showNotification}
        onClose={handleCloseNotification}
      />

      {/* Floating rank display */}
      <LadderFloatingRank
        userRank={userRank}
        onJumpToUser={jumpToCurrentUser}
        selectedDivision={filters.selectedDivision}
        filterProject={filters.filterProject}
      />

      {/* Header and Filters */}
      <LadderHeader
        title="排行榜"
        selectedDivision={filters.selectedDivision}
        onDivisionChange={filters.setSelectedDivision}
        filterProject={filters.filterProject}
        onProjectChange={filters.setFilterProject}
        userRank={userRank}
        showUserContext={showUserContext}
        onToggleUserContext={() => setShowUserContext(!showUserContext)}
      />

      {/* Content area */}
      <div className={styles.contentArea}>
        <LadderList
          ladderData={ladderData}
          displayStartRank={displayStartRank}
          currentUserId={userProfile?.uid}
          onUserClick={handleUserClick}
          onRefresh={handleRefresh}
          loading={loading}
          displayMode={filters.selectedDivision}
          filterProject={filters.filterProject}
          scrollTrigger={scrollTrigger}
        />

        {/* Pagination */}
        <LadderPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalUsers={totalUsers}
          onPageChange={handlePageChange}
          onPageSelect={handlePageSelect}
        />
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {userRank > 50 && (
          <p className={styles.footerText}>
            💡 提示：您的排名為第 {userRank} 名，可以點擊上方按鈕查看您附近的競爭對手
          </p>
        )}
      </div>

      {/* User card modal would go here */}
      {showUserCard && selectedUserForCard && (
        <div className={styles.userCardModal}>
          {/* TODO: Implement LadderUserCard component */}
          <button onClick={() => {
            setShowUserCard(false);
            setSelectedUserForCard(null);
          }}>
            關閉
          </button>
        </div>
      )}
    </div>
  );
};

export default Ladder;
