import { useState, useEffect, useCallback } from 'react';

/**
 * Ladder Filters Hook
 * Manages all filter states for ladder component
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const useLadderFilters = (initialFilters = {}) => {
  const [filterGender, setFilterGender] = useState(initialFilters.gender || 'all');
  const [filterAge, setFilterAge] = useState(initialFilters.age || 'all');
  const [filterHeight, setFilterHeight] = useState(initialFilters.height || 'all');
  const [filterWeight, setFilterWeight] = useState(initialFilters.weight || 'all');
  const [filterJob, setFilterJob] = useState(initialFilters.job || 'all');
  const [filterProject, setFilterProject] = useState(initialFilters.project || 'total');
  const [filterRegionLevel, setFilterRegionLevel] = useState(initialFilters.regionLevel || 'all');
  const [selectedDivision, setSelectedDivision] = useState(initialFilters.division || 'ladderScore');
  const [selectedTab, setSelectedTab] = useState(initialFilters.tab || 'all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialFilters.ageGroup || 'all');

  /**
   * Reset filterProject based on selectedDivision
   */
  useEffect(() => {
    // Don't reset if navigating from another page with specific filter
    if (initialFilters.preventReset) {
      return;
    }

    switch (selectedDivision) {
      case 'stats_bodyFat':
        setFilterProject('bodyFat');
        break;
      case 'stats_ffmi':
        setFilterProject('score');
        break;
      case 'stats_cooper':
        setFilterProject('cooper');
        break;
      case 'stats_vertical':
        setFilterProject('vertical');
        break;
      case 'stats_sbdTotal':
        setFilterProject('total');
        break;
      default:
        setFilterProject('total');
        break;
    }
  }, [selectedDivision, initialFilters.preventReset]);

  /**
   * Handle navigation from other pages
   */
  const handleNavigationFilter = useCallback((filterType) => {
    if (filterType === '5km') {
      setSelectedDivision('stats_cooper');
      setTimeout(() => {
        setFilterProject('5km');
      }, 50);
    } else if (filterType === 'armSize') {
      setSelectedDivision('armSize');
    }
  }, []);

  /**
   * Reset all filters to default
   */
  const resetFilters = useCallback(() => {
    setFilterGender('all');
    setFilterAge('all');
    setFilterHeight('all');
    setFilterWeight('all');
    setFilterJob('all');
    setFilterProject('total');
    setFilterRegionLevel('all');
    setSelectedDivision('ladderScore');
    setSelectedTab('all');
    setSelectedAgeGroup('all');
  }, []);

  return {
    // Filter states
    filterGender,
    filterAge,
    filterHeight,
    filterWeight,
    filterJob,
    filterProject,
    filterRegionLevel,
    selectedDivision,
    selectedTab,
    selectedAgeGroup,
    
    // Setters
    setFilterGender,
    setFilterAge,
    setFilterHeight,
    setFilterWeight,
    setFilterJob,
    setFilterProject,
    setFilterRegionLevel,
    setSelectedDivision,
    setSelectedTab,
    setSelectedAgeGroup,
    
    // Actions
    handleNavigationFilter,
    resetFilters
  };
};
