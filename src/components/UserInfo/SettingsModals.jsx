import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { t } from '../../i18n';
import styles from '../../styles/modules/SettingsModals.module.css';
import { MagitekButton } from '../ui/MagitekButton';

/**
 * Settings Modals Component
 * Manages settings-related modals (privacy, notifications, etc.)
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const SettingsModals = () => {
  const activeModals = useUIStore((state) => state.activeModals);
  const closeModal = useUIStore((state) => state.closeModal);
  const [settings, setSettings] = useState({
    privacy: {
      showProfile: true,
      showStats: true,
      showWorkouts: false
    },
    notifications: {
      rankUpdates: true,
      achievements: true,
      weeklyReport: false
    }
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // TODO: Save settings to userStore
    console.log('Settings saved:', settings);
    closeModal('settings');
  };

  return (
    <>
      {/* Privacy Settings Modal */}
      {activeModals.includes('privacy') && (
        <div className={styles.modalOverlay} onClick={() => closeModal('privacy')}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>隱私設定</h3>
              <button
                className={styles.closeButton}
                onClick={() => closeModal('privacy')}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.privacy.showProfile}
                    onChange={(e) => handleSettingChange('privacy', 'showProfile', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>顯示個人資料</span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.privacy.showStats}
                    onChange={(e) => handleSettingChange('privacy', 'showStats', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>顯示統計數據</span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.privacy.showWorkouts}
                    onChange={(e) => handleSettingChange('privacy', 'showWorkouts', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>顯示訓練記錄</span>
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <MagitekButton
                variant="ghost"
                size="small"
                className={styles.footerButton}
                onClick={() => closeModal('privacy')}
              >
                {t('common.cancel', '取消')}
              </MagitekButton>
              <MagitekButton
                variant="primary"
                size="small"
                className={styles.footerButton}
                onClick={handleSaveSettings}
              >
                {t('common.save', '儲存')}
              </MagitekButton>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings Modal */}
      {activeModals.includes('notifications') && (
        <div className={styles.modalOverlay} onClick={() => closeModal('notifications')}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('settings.notifications.title', '通知設定')}</h3>
              <button
                className={styles.closeButton}
                onClick={() => closeModal('notifications')}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.rankUpdates}
                    onChange={(e) => handleSettingChange('notifications', 'rankUpdates', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>排名更新通知</span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.achievements}
                    onChange={(e) => handleSettingChange('notifications', 'achievements', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>成就通知</span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.notifications.weeklyReport}
                    onChange={(e) => handleSettingChange('notifications', 'weeklyReport', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>週報通知</span>
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <MagitekButton
                variant="ghost"
                size="small"
                className={styles.footerButton}
                onClick={() => closeModal('notifications')}
              >
                {t('common.cancel', '取消')}
              </MagitekButton>
              <MagitekButton
                variant="primary"
                size="small"
                className={styles.footerButton}
                onClick={handleSaveSettings}
              >
                {t('common.save', '儲存')}
              </MagitekButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsModals;
