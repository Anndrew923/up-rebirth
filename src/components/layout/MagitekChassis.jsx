import { useCallback, useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useUserStore } from '../../stores/userStore';
import '../../styles/modules/ChassisGeometry.module.css';
import styles from '../../styles/modules/MagitekChassis.module.css';
import crownStyles from '../../styles/modules/Crown.module.css';
import navStyles from '../../styles/modules/NavRail.module.css';
import pedestalStyles from '../../styles/modules/Pedestal.module.css';
import hudStyles from '../../styles/modules/MagitekHUD.module.css';
import bottomPedestal from '../../assets/images/magitek/bottom_pedestal.svg';
import hudTopBar from '../../assets/images/magitek/hud-top-bar.svg';
import hudBell from '../../assets/images/magitek/hud-bell.svg';
import masterNebula from '../../assets/images/magitek/master-bg-nebula.svg';
import railTop from '../../assets/images/magitek/rail-top.svg';
import railMid from '../../assets/images/magitek/rail-mid.svg';
import railBottom from '../../assets/images/magitek/rail-bottom.svg';
import { AvatarSection } from '../UserInfo/AvatarSection';
import { SettingsModals } from '../UserInfo/SettingsModals';
import { MagitekHUD } from './MagitekHUD';

/**
 * Magitek Resonance 2.0 Chassis
 * Three-Layer Architecture System
 * 
 * Part of the Rebirth Manifesto: Magitek Three-Layer Chassis
 * 
 * Structure:
 * 1. Background Layer - Ambient effects, decorative elements
 * 2. ScrollContent Layer - Main scrollable business logic content
 * 3. Foreground Layer - Fixed UI elements, modals, overlays
 * 
 * @param {React.ReactNode} background - Optional content for Background layer
 * @param {React.ReactNode} children - Content to render in ScrollContent layer
 * @param {React.ReactNode} foreground - Optional content for Foreground layer (HUD, exoskeleton, etc.)
 */
export const MagitekChassis = ({ background = null, children, foreground = null }) => {
  const isOverlayVisible = useUIStore((state) => state.isOverlayVisible);
  const activeModals = useUIStore((state) => state.activeModals);
  const openModal = useUIStore((state) => state.openModal);

  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const stats = useUserStore((state) => state.stats);
  const userProfile = useUserStore((state) => state.userProfile);

  const user = useMemo(() => {
    const ladderScore = Number(stats?.ladderScore);
    const combatPowerFromLadder =
      Number.isFinite(ladderScore) && ladderScore > 0 ? Math.round(ladderScore) : null;

    const scores = stats?.scores && typeof stats.scores === 'object' ? stats.scores : null;
    const scoreKeys = ['strength', 'explosivePower', 'cardio', 'muscleMass', 'bodyFat'];
    const scoreValues = scores
      ? scoreKeys
          .map((k) => Number(scores[k]))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const combatPowerFromScores =
      scoreValues.length > 0
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : null;

    const combatPower = combatPowerFromLadder ?? combatPowerFromScores ?? 0;

    const nickname =
      stats?.nickname ||
      stats?.displayName ||
      userProfile?.displayName ||
      userProfile?.email?.split?.('@')?.[0] ||
      'UserNickname';

    return { combatPower, nickname };
  }, [stats?.ladderScore, stats?.scores, stats?.nickname, stats?.displayName, userProfile?.displayName, userProfile?.email]);

  // V6 Spec: Bottom pedestal + side rails are the ONLY navigation entry points (authenticated surface only).
  const navigationEnabled = Boolean(isAuthenticated);

  // Neon Scalpel (Diagnostic): enable only when ?debugDock=1
  const debugDocking = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return params.get('debugDock') === '1';
    } catch {
      return false;
    }
  }, []);

  // Ghost Exorcism Protocol: enable only when ?ghostFrame=1
  const ghostFrameTest = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return params.get('ghostFrame') === '1';
    } catch {
      return false;
    }
  }, []);

  const goHash = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return (
    <div
      className={`${styles.chassis} ${debugDocking ? styles.debugDocking : ''} ${
        debugDocking ? hudStyles.debugDocking : ''
      } ${debugDocking ? crownStyles.debugDocking : ''} ${
        ghostFrameTest ? styles.ghostFrameTest : ''
      } ${ghostFrameTest ? crownStyles.ghostFrameTest : ''}`}
    >
      {/* Background Layer - Ambient effects, decorative elements */}
      <div id="layer-master-bg" className={styles.backgroundLayer}>
        <img className={styles.masterBgImg} src={masterNebula} alt="" aria-hidden="true" />
        {background}
      </div>

      {/* ScrollContent Layer - Main scrollable business logic */}
      <div id="layer-scroll-content" className={styles.scrollContentLayer}>
        <div className={styles.scrollInnerView}>
          <div className={styles.scrollContent}>
            {children}
            <div className={styles.pageFooterSpacer} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Foreground Layer - Fixed UI, modals, overlays */}
      <div 
        className={`${styles.foregroundLayer} ${isOverlayVisible ? styles.overlayActive : ''}`}
      >
        {/* Top Layer: HUD Mask & Exoskeleton Frame */}
        <div id="layer-hud-mask" className={styles.hudMaskLayer}>
          {/* Glass blur sublayer (must stay BELOW metal frames) */}
          {navigationEnabled && <div className={crownStyles.blurSublayerTop} aria-hidden="true" />}

          {/* V6 Crown (hud-top-bar.png) - must not be obscured by nav layers */}
          {navigationEnabled && (
            <div className={crownStyles.crownRoot} aria-label="magitek-crown">
              <div className={crownStyles.crownFrame} aria-hidden="false">
                {/* Avatar positioned BEHIND the HUD image (through the observation window) */}
                <div className={crownStyles.avatarPortal}>
                  <AvatarSection variant="hud" />
                </div>

                {/* Notification hub (HUD bell) */}
                <button
                  type="button"
                  className={crownStyles.crownNotificationButton}
                  aria-label="通知中心"
                  title="通知中心"
                  onClick={() => openModal('notifications')}
                >
                  <img className={crownStyles.crownNotificationIcon} src={hudBell} alt="" aria-hidden="true" />
                </button>

                {/* Commander Identity Module (Single-Focus Layout) */}
                <MagitekHUD user={user} />

                <img className={crownStyles.crownBarImage} src={hudTopBar} alt="" aria-hidden="true" />
              </div>
            </div>
          )}

          {/* V6 Navigation Shell: Side rails + icon nodes (authenticated only) */}
          {navigationEnabled && (
            <div className={navStyles.navShell} aria-label="magitek-navigation">
              {/* Left rail (Emotional/Interaction) */}
              <div className={`${navStyles.navRail} ${navStyles.navRailLeft}`} aria-hidden="true">
                <img className={navStyles.railCap} src={railTop} alt="" aria-hidden="true" />
                <div className={navStyles.railMid} style={{ backgroundImage: `url(${railMid})` }} aria-hidden="true" />
                <img className={navStyles.railCap} src={railBottom} alt="" aria-hidden="true" />
              </div>

              {/* Right rail (Rational/Data) */}
              <div className={`${navStyles.navRail} ${navStyles.navRailRight}`} aria-hidden="true">
                <img className={navStyles.railCap} src={railTop} alt="" aria-hidden="true" />
                <div className={navStyles.railMid} style={{ backgroundImage: `url(${railMid})` }} aria-hidden="true" />
                <img className={navStyles.railCap} src={railBottom} alt="" aria-hidden="true" />
              </div>

              {/* Icon Nodes (interactive) */}
              <div className={navStyles.navNodes} aria-hidden="false">
                {/* Left Rail Nodes */}
                <button
                  type="button"
                  className={`${navStyles.navNode} ${navStyles.nodeTime}`}
                  aria-label="時光迴廊（歷史 / 紀錄）"
                  title="時光迴廊"
                  onClick={() => goHash('#history')}
                >
                  ⏱
                </button>
                <button
                  type="button"
                  className={`${navStyles.navNode} ${navStyles.nodeSoul}`}
                  aria-label="靈魂共鳴（社群 / 互動）"
                  title="靈魂共鳴"
                  onClick={() => goHash('#community')}
                >
                  💬
                </button>

                {/* Right Rail Nodes */}
                <button
                  type="button"
                  className={`${navStyles.navNode} ${navStyles.nodeTools}`}
                  aria-label="時空計畫（工具 / 輔助）"
                  title="時空計畫"
                  onClick={() => goHash('#tools')}
                >
                  🧰
                </button>
                <button
                  type="button"
                  className={`${navStyles.navNode} ${navStyles.nodeTuning}`}
                  aria-label="核心調律（設定 / 配置）"
                  title="核心調律"
                  onClick={() => goHash('#settings')}
                >
                  ⚙
                </button>
                <button
                  type="button"
                  className={`${navStyles.navNode} ${navStyles.nodeHonor}`}
                  aria-label="榮耀徽章（認證 / 成就）"
                  title="榮耀徽章"
                  onClick={() => goHash('#honor')}
                >
                  🏅
                </button>
              </div>
            </div>
          )}

          {/* Page HUD / exoskeleton slot (must manage pointer-events itself) */}
          {foreground ? (
            <div className={styles.exoskeleton} aria-label="magitek-exoskeleton">
              {foreground}
            </div>
          ) : null}

          {/* Structural Closure: Bottom Pedestal */}
          {navigationEnabled && (
            <div className={pedestalStyles.pedestalWrapper}>
              <div className={pedestalStyles.pedestalOcclusion} aria-hidden="true" />
              <div className={pedestalStyles.blurSublayerBottom} aria-hidden="true" />
              <img className={pedestalStyles.pedestalImg} src={bottomPedestal} alt="" aria-hidden="true" />

              {/* Trinity Entry Slots (placeholders) */}
              <div className={pedestalStyles.pedestalSlots} aria-hidden="false">
                <button
                  type="button"
                  className={`${pedestalStyles.pedestalSlot} ${pedestalStyles.slotLeft}`}
                  aria-label="左插槽：訓練場（評測專頁）"
                  title="訓練場（評測專頁）"
                  onClick={() => {
                    window.location.hash = '#evaluation';
                  }}
                />
                <button
                  type="button"
                  className={`${pedestalStyles.pedestalSlot} ${pedestalStyles.slotCenter}`}
                  aria-label="中插槽：主控台（Home / 雷達圖）"
                  title="主控台"
                  onClick={() => {
                    window.location.hash = '#home';
                  }}
                />
                <button
                  type="button"
                  className={`${pedestalStyles.pedestalSlot} ${pedestalStyles.slotRight}`}
                  aria-label="右插槽：天梯競技場（Arena）"
                  title="天梯競技場"
                  onClick={() => {
                    window.location.hash = '#ladder';
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Overlay backdrop */}
        {isOverlayVisible && (
          <div 
            className={styles.overlayBackdrop}
            aria-label="Overlay backdrop"
          />
        )}

        {/* Modal container */}
        {activeModals.length > 0 && (
          <div className={styles.modalContainer}>
            {/* Modals will be rendered here by modal components */}
          </div>
        )}

        {/* Global Settings/Notifications modals (available on every route) */}
        <SettingsModals />
      </div>
    </div>
  );
};

export default MagitekChassis;
