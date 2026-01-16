import styles from '../../styles/modules/LadderHeader.module.css';

/**
 * Ladder Header Component
 * Contains title and filter controls
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const LadderHeader = ({
  title = '排行榜',
  selectedDivision,
  onDivisionChange,
  filterGender,
  filterAge,
  filterHeight,
  filterWeight,
  filterJob,
  filterProject,
  filterRegionLevel,
  onGenderChange,
  onAgeChange,
  onHeightChange,
  onWeightChange,
  onJobChange,
  onProjectChange,
  onRegionLevelChange,
  userRank,
  showUserContext,
  onToggleUserContext
}) => {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>

      {/* Division Filter - Simplified for now */}
      <div className={styles.filters}>
        <select
          value={selectedDivision}
          onChange={(e) => onDivisionChange(e.target.value)}
          className={styles.divisionSelect}
        >
          <option value="ladderScore">戰鬥力</option>
          <option value="stats_sbdTotal">三項總和</option>
          <option value="stats_bodyFat">體脂率</option>
          <option value="stats_ffmi">肌肉量</option>
          <option value="stats_cooper">有氧能力</option>
          <option value="stats_vertical">爆發力</option>
        </select>

        {/* Additional filters can be added here */}
        {selectedDivision === 'stats_sbdTotal' && (
          <select
            value={filterProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className={styles.projectSelect}
          >
            <option value="total">三項總和</option>
            <option value="squat">深蹲</option>
            <option value="bench">臥推</option>
            <option value="deadlift">硬舉</option>
          </select>
        )}
      </div>

      {userRank > 50 && (
        <button
          className={styles.contextButton}
          onClick={onToggleUserContext}
        >
          {showUserContext ? '顯示前 50 名' : '顯示我的範圍'}
        </button>
      )}
    </div>
  );
};

export default LadderHeader;
