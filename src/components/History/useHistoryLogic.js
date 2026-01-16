import { useState, useMemo, useRef, useEffect } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../stores/uiStore';

/**
 * History Logic Hook
 * Manages history display, pagination, and deletion
 * Part of Phase 4.3 Rebirth Migration
 * 
 * Migrated from legacy useHistoryLogic.js
 * - Replaced UserContext with useUserStore
 * - Integrated with workoutHistory from userStore
 */

export function useHistoryLogic() {
  const workoutHistory = useUserStore((state) => state.workoutHistory);
  const stats = useUserStore((state) => state.stats);
  const loadWorkoutHistory = useUserStore((state) => state.loadWorkoutHistory);
  const deleteWorkoutHistory = useUserStore((state) => state.deleteWorkoutHistory);
  const MAX_HISTORY_RECORDS = useUserStore((state) => state.MAX_HISTORY_RECORDS);
  const setLoadingMessage = useUIStore((state) => state.setLoadingMessage);

  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [selectedChartData, setSelectedChartData] = useState('total');
  const hasLoggedRef = useRef(false);

  // Load history on mount
  useEffect(() => {
    loadWorkoutHistory();
  }, [loadWorkoutHistory]);

  // Get history from workoutHistory or stats.history (backward compatibility)
  const sortedHistory = useMemo(() => {
    const history = workoutHistory.length > 0 
      ? workoutHistory 
      : (stats?.history || []);
    
    return [...history].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : (a.date ? new Date(a.date) : new Date(0));
      const dateB = b.timestamp ? new Date(b.timestamp) : (b.date ? new Date(b.date) : new Date(0));
      return dateB - dateA;
    });
  }, [workoutHistory, stats?.history]);

  const totalPages = Math.ceil(sortedHistory.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = sortedHistory.slice(startIndex, endIndex);

  const recordCount = sortedHistory.length;
  const maxRecords = MAX_HISTORY_RECORDS || 50;
  const isNearLimit = recordCount >= maxRecords * 0.8;
  const isAtLimit = recordCount >= maxRecords;

  // Chart data
  const chartData = useMemo(() => {
    if (sortedHistory.length === 0) return null;

    const recentHistory = sortedHistory.slice(0, 6);

    const labels = recentHistory
      .map(record => {
        const date = record.timestamp
          ? new Date(record.timestamp)
          : new Date(record.date);
        return date.toLocaleDateString('zh-TW', {
          month: 'numeric',
          day: 'numeric',
        });
      })
      .reverse();

    const totalScores = recentHistory
      .map(record => {
        const scores = record.scores || {};
        return (
          record.averageScore ||
          (
            Object.values(scores)
              .filter(s => s > 0)
              .reduce((sum, s) => sum + s, 0) /
            Object.values(scores).filter(s => s > 0).length
          ).toFixed(2)
        );
      })
      .reverse();

    const strengthScores = recentHistory
      .map(record => (record.scores?.strength || 0).toFixed(2))
      .reverse();

    const explosiveScores = recentHistory
      .map(record => (record.scores?.explosivePower || 0).toFixed(2))
      .reverse();

    const cardioScores = recentHistory
      .map(record => (record.scores?.cardio || 0).toFixed(2))
      .reverse();

    const muscleMassScores = recentHistory
      .map(record => (record.scores?.muscleMass || 0).toFixed(2))
      .reverse();

    const bodyFatScores = recentHistory
      .map(record => (record.scores?.bodyFat || 0).toFixed(2))
      .reverse();

    return {
      labels,
      datasets: [
        {
          label: '總分',
          data: totalScores,
          color: '#28a745',
          key: 'total',
        },
        {
          label: '力量',
          data: strengthScores,
          color: '#007bff',
          key: 'strength',
        },
        {
          label: '爆發力',
          data: explosiveScores,
          color: '#ffc107',
          key: 'explosive',
        },
        {
          label: '心肺',
          data: cardioScores,
          color: '#dc3545',
          key: 'cardio',
        },
        {
          label: '肌肉量',
          data: muscleMassScores,
          color: '#6f42c1',
          key: 'muscle',
        },
        {
          label: '體脂',
          data: bodyFatScores,
          color: '#fd7e14',
          key: 'ffmi',
        },
      ],
    };
  }, [sortedHistory]);

  const getScoreClass = (score) => {
    const numScore = Number(score);
    if (numScore >= 80) return 'score-excellent';
    if (numScore >= 60) return 'score-good';
    if (numScore >= 40) return 'score-fair';
    if (numScore > 0) return 'score-poor';
    return 'score-none';
  };

  const toggleDeleteOptions = () => {
    setShowDeleteOptions(!showDeleteOptions);
    setSelectedRecords([]);
  };

  const handleSelectRecord = (index) => {
    if (selectedRecords.includes(index)) {
      setSelectedRecords(selectedRecords.filter(i => i !== index));
    } else {
      setSelectedRecords([...selectedRecords, index]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRecords.length === 0) return;

    setLoadingMessage('刪除中...');

    try {
      // Get record IDs from selected indices
      const recordsToDelete = selectedRecords
        .map(index => sortedHistory[index])
        .filter(record => record.id)
        .map(record => record.id);

      if (recordsToDelete.length > 0) {
        const result = await deleteWorkoutHistory(recordsToDelete);
        
        if (result.success) {
          setShowDeleteOptions(false);
          setSelectedRecords([]);
          setCurrentPage(1);
          
          // Reload history
          await loadWorkoutHistory();
        } else {
          alert('刪除失敗：' + (result.error || '未知錯誤'));
        }
      } else {
        alert('無法刪除：選中的記錄沒有有效的 ID');
      }
    } catch (error) {
      console.error('刪除記錄失敗:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setLoadingMessage(null);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
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
  };
}
