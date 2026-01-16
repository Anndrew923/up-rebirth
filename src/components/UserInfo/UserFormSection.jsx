import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../stores/uiStore';
import { validateFitnessData, sanitizeInput } from '../../utils/validation';
import styles from '../../styles/modules/UserFormSection.module.css';

/**
 * User Form Section Component
 * Handles user profile form inputs and updates
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Ported from legacy UserInfo UserFormSection
 * Integrates with userStore.updateUserStats() for Zero-Trust validation
 */
export const UserFormSection = () => {
  const userProfile = useUserStore((state) => state.userProfile);
  const stats = useUserStore((state) => state.stats);
  const updateUserStats = useUserStore((state) => state.updateUserStats);
  const setLoadingMessage = useUIStore((state) => state.setLoadingMessage);

  // Form state - matches legacy field names
  const [formData, setFormData] = useState({
    nickname: '',
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    bio: ''
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [weightReminder, setWeightReminder] = useState(false);

  // Initialize form data from store
  useEffect(() => {
    if (userProfile || stats) {
      setFormData({
        nickname: userProfile?.nickname || userProfile?.displayName || '',
        weight: stats?.weight || stats?.bodyweight || '',
        height: stats?.height || '',
        age: stats?.age || '',
        gender: stats?.gender || 'male',
        bio: stats?.bio || ''
      });
    }
  }, [userProfile, stats]);

  // Weight reminder check
  useEffect(() => {
    if (formData.weight) {
      const weight = parseFloat(formData.weight);
      const daysSinceUpdate = stats?.lastWeightUpdate 
        ? Math.floor((Date.now() - new Date(stats.lastWeightUpdate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Show reminder if weight hasn't been updated in 7+ days
      if (daysSinceUpdate === null || daysSinceUpdate >= 7) {
        setWeightReminder(true);
      } else {
        setWeightReminder(false);
      }
    }
  }, [formData.weight, stats?.lastWeightUpdate]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle nickname change
  const handleNicknameChange = useCallback((value) => {
    handleInputChange('nickname', value);
  }, [handleInputChange]);

  // Generate random nickname
  const handleGenerateNickname = useCallback(() => {
    const adjectives = ['強壯', '敏捷', '堅韌', '勇敢', '智慧', '優雅', '迅猛', '穩健'];
    const nouns = ['戰士', '獵人', '守護者', '探索者', '勇士', '武者', '行者', '鬥士'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    const generatedNickname = `${randomAdj}${randomNoun}${randomNum}`;
    handleNicknameChange(generatedNickname);
  }, [handleNicknameChange]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Basic info validation (required for navigation)
    if (!formData.height || !formData.weight || !formData.age || !formData.gender) {
      // Don't show error, but mark as incomplete
    }

    if (formData.weight) {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight < 0.1 || weight > 1000) {
        newErrors.weight = '體重必須在 0.1 到 1000 公斤之間';
      }
    }

    if (formData.height) {
      const height = parseFloat(formData.height);
      if (isNaN(height) || height < 50 || height > 300) {
        newErrors.height = '身高必須在 50 到 300 公分之間';
      }
    }

    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 150) {
        newErrors.age = '年齡必須在 1 到 150 歲之間';
      }
    }

    if (formData.nickname) {
      const sanitized = sanitizeInput(formData.nickname);
      if (sanitized.length < 2) {
        newErrors.nickname = '暱稱至少需要 2 個字符';
      } else if (sanitized.length > 20) {
        newErrors.nickname = '暱稱不能超過 20 個字符';
      }
    }

    if (formData.bio) {
      const sanitized = sanitizeInput(formData.bio);
      if (sanitized.length > 500) {
        newErrors.bio = '個人簡介不能超過 500 字';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setLoadingMessage('正在儲存...');

    try {
      // Prepare updates with Zero-Trust validation
      const updates = {};

      if (formData.weight) {
        updates.weight = parseFloat(formData.weight);
        updates.bodyweight = updates.weight; // Support both field names
        updates.lastWeightUpdate = new Date().toISOString();
      }

      if (formData.height) {
        updates.height = parseFloat(formData.height);
      }

      if (formData.age) {
        updates.age = parseInt(formData.age);
      }

      if (formData.gender) {
        updates.gender = formData.gender;
      }

      if (formData.nickname) {
        updates.nickname = sanitizeInput(formData.nickname);
        updates.displayName = updates.nickname; // Support both field names
      }

      if (formData.bio) {
        updates.bio = sanitizeInput(formData.bio);
      }

      // Use userStore.updateUserStats() which includes Zero-Trust validation
      const result = await updateUserStats(updates);

      if (result.success) {
        setLoadingMessage(null);
        setWeightReminder(false);
        // Success feedback could be shown here using UI store
        console.log('✅ 資料儲存成功');
      } else {
        setErrors({ submit: result.error || '儲存失敗，請稍後再試' });
        setLoadingMessage(null);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      setErrors({ submit: error.message || '儲存失敗，請稍後再試' });
      setLoadingMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Alias for compatibility with legacy code
  const saveData = handleSubmit;

  return (
    <div className={styles.formSection}>
      <h3 className={styles.title}>個人資料</h3>
      
      {weightReminder && (
        <div className={styles.reminder}>
          💡 提示：建議每週更新一次體重以獲得準確的數據分析
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Nickname field */}
        <div className={styles.formGroup}>
          <label htmlFor="nickname" className={styles.label}>
            暱稱
          </label>
          <div className={styles.nicknameGroup}>
            <input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              className={`${styles.input} ${errors.nickname ? styles.inputError : ''}`}
              placeholder="您的暱稱"
              maxLength={20}
            />
            <button
              type="button"
              onClick={handleGenerateNickname}
              className={styles.generateButton}
              title="隨機生成暱稱"
            >
              🎲
            </button>
          </div>
          {errors.nickname && (
            <span className={styles.errorText}>{errors.nickname}</span>
          )}
        </div>

        {/* Weight and Height row */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="weight" className={styles.label}>
              體重 (kg) *
            </label>
            <input
              id="weight"
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className={`${styles.input} ${errors.weight ? styles.inputError : ''}`}
              placeholder="0.0"
              step="0.1"
              min="0.1"
              max="1000"
              required
            />
            {errors.weight && (
              <span className={styles.errorText}>{errors.weight}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="height" className={styles.label}>
              身高 (cm) *
            </label>
            <input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              className={`${styles.input} ${errors.height ? styles.inputError : ''}`}
              placeholder="0"
              step="1"
              min="50"
              max="300"
              required
            />
            {errors.height && (
              <span className={styles.errorText}>{errors.height}</span>
            )}
          </div>
        </div>

        {/* Age and Gender row */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="age" className={styles.label}>
              年齡 *
            </label>
            <input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
              placeholder="0"
              step="1"
              min="1"
              max="150"
              required
            />
            {errors.age && (
              <span className={styles.errorText}>{errors.age}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>
              性別 *
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={styles.select}
              required
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        {/* Bio field */}
        <div className={styles.formGroup}>
          <label htmlFor="bio" className={styles.label}>
            個人簡介
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className={`${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
            placeholder="介紹一下自己..."
            rows={4}
            maxLength={500}
          />
          <div className={styles.charCount}>
            {formData.bio.length} / 500
          </div>
          {errors.bio && (
            <span className={styles.errorText}>{errors.bio}</span>
          )}
        </div>

        {errors.submit && (
          <div className={styles.submitError} role="alert">
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? '儲存中...' : '儲存變更'}
        </button>
      </form>
    </div>
  );
};

export default UserFormSection;
