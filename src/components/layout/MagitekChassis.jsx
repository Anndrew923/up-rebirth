import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useUserStore } from '../../stores/userStore';
import styles from '../../styles/modules/MagitekChassis.module.css';
import bottomPedestal from '../../assets/images/magitek/bottom_pedestal.png';
import hudTopBar from '../../assets/images/magitek/hud-top-bar.png';
import hudBell from '../../assets/images/magitek/hud-bell.svg';
import masterNebula from '../../assets/images/magitek/master-bg-nebula.png';
import railTop from '../../assets/images/magitek/rail-top.png';
import railMid from '../../assets/images/magitek/rail-mid.png';
import railBottom from '../../assets/images/magitek/rail-bottom.png';
import { AvatarSection } from '../UserInfo/AvatarSection';
import { SettingsModals } from '../UserInfo/SettingsModals';

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

  // V6 Spec: Bottom pedestal + side rails are the ONLY navigation entry points (authenticated surface only).
  const navigationEnabled = Boolean(isAuthenticated);

  // Structural closure is required whenever navigation is enabled (pedestal height affects layout),
  // or when a page provides a foreground HUD/exoskeleton.
  const structuralClosureEnabled = navigationEnabled || Boolean(foreground);

  // ----------------------------
  // V6 Crown geometry (hud-top-bar.png)
  // ----------------------------
  const HUD_NATURAL = useMemo(
    () => ({
      width: 1710,
      height: 534,
      // Verified by alpha-component analysis on hud-top-bar.png (enclosed transparent circle)
      // Component bbox: X[119..413], Y[117..412]
      // centroid ≈ (265.49, 264.94), diameter ≈ (295..296)
      holeCenterX: 265.5,
      holeCenterY: 265,
      holeDiameter: 296,
    }),
    []
  );

  // Crown height is now measured from the responsive HUD container (no pixel offsets).
  const crownRef = useRef(null);
  const [hudHeightPx, setHudHeightPx] = useState(0);

  // Measure pedestal height and expose it via CSS var for precise rail docking.
  const pedestalRef = useRef(null);
  const [pedestalHeightPx, setPedestalHeightPx] = useState(0);

  const PEDESTAL_NATURAL = useMemo(
    () => ({
      width: 1284,
      height: 429,
    }),
    []
  );

  useEffect(() => {
    if (!navigationEnabled) return;
    const el = crownRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      if (Number.isFinite(h) && h > 0) setHudHeightPx(Math.round(h));
    });
    ro.observe(el);

    const h0 = el.getBoundingClientRect().height;
    if (Number.isFinite(h0) && h0 > 0) setHudHeightPx(Math.round(h0));

    return () => ro.disconnect();
  }, [navigationEnabled]);

  const predictedHudHeightPx = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const hudWidth = Math.min(1100, Math.max(320, vw - 24));
    return Math.round((hudWidth * HUD_NATURAL.height) / HUD_NATURAL.width);
  }, [HUD_NATURAL.height, HUD_NATURAL.width]);

  const resolvedHudHeightPx = hudHeightPx || predictedHudHeightPx;

  useEffect(() => {
    if (!navigationEnabled) return;

    const computePredicted = () => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
      const w = Math.min(PEDESTAL_NATURAL.width, vw);
      const h = Math.round((w * PEDESTAL_NATURAL.height) / PEDESTAL_NATURAL.width);
      setPedestalHeightPx(h);
    };

    computePredicted();
    window.addEventListener('resize', computePredicted);
    return () => window.removeEventListener('resize', computePredicted);
  }, [navigationEnabled, PEDESTAL_NATURAL.height, PEDESTAL_NATURAL.width]);

  useEffect(() => {
    if (!navigationEnabled) return;
    const el = pedestalRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      if (Number.isFinite(h) && h > 0) setPedestalHeightPx(Math.round(h));
    });
    ro.observe(el);

    const h0 = el.getBoundingClientRect().height;
    if (Number.isFinite(h0) && h0 > 0) setPedestalHeightPx(Math.round(h0));

    return () => ro.disconnect();
  }, [navigationEnabled]);

  const goHash = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return (
    <div
      className={styles.chassis}
      style={{
        '--magitek-pedestal-h': navigationEnabled ? `${pedestalHeightPx}px` : '0px',
        '--magitek-hud-h': navigationEnabled ? `${resolvedHudHeightPx}px` : '0px',
      }}
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
          </div>
        </div>
      </div>

      {/* Foreground Layer - Fixed UI, modals, overlays */}
      <div 
        className={`${styles.foregroundLayer} ${isOverlayVisible ? styles.overlayActive : ''}`}
      >
        {/* Top Layer: HUD Mask & Exoskeleton Frame */}
        <div id="layer-hud-mask" className={styles.hudMaskLayer}>
          {/* V6 Crown (hud-top-bar.png) - must not be obscured by nav layers */}
          {navigationEnabled && (
            <div className={styles.crownRoot} aria-label="magitek-crown">
              <div className={styles.crownFrame} ref={crownRef} aria-hidden="false">
                {/* Avatar positioned BEHIND the HUD image (through the observation window) */}
                <div className={styles.crownAvatarBehind}>
                  <AvatarSection variant="hud" />
                </div>

                {/* Notification hub (HUD bell) */}
                <button
                  type="button"
                  className={styles.crownNotificationButton}
                  aria-label="通知中心"
                  title="通知中心"
                  onClick={() => openModal('notifications')}
                >
                  <img className={styles.crownNotificationIcon} src={hudBell} alt="" aria-hidden="true" />
                </button>

                <img className={styles.crownBarImage} src={hudTopBar} alt="" aria-hidden="true" />
              </div>
            </div>
          )}

          {/* V6 Navigation Shell: Side rails + icon nodes (authenticated only) */}
          {navigationEnabled && (
            <div className={styles.navShell} aria-label="magitek-navigation">
              {/* Left rail (Emotional/Interaction) */}
              <div className={`${styles.navRail} ${styles.navRailLeft}`} aria-hidden="true">
                <img className={styles.railCap} src={railTop} alt="" aria-hidden="true" />
                <div className={styles.railMid} style={{ backgroundImage: `url(${railMid})` }} aria-hidden="true" />
                <img className={styles.railCap} src={railBottom} alt="" aria-hidden="true" />
              </div>

              {/* Right rail (Rational/Data) */}
              <div className={`${styles.navRail} ${styles.navRailRight}`} aria-hidden="true">
                <img className={styles.railCap} src={railTop} alt="" aria-hidden="true" />
                <div className={styles.railMid} style={{ backgroundImage: `url(${railMid})` }} aria-hidden="true" />
                <img className={styles.railCap} src={railBottom} alt="" aria-hidden="true" />
              </div>

              {/* Icon Nodes (interactive) */}
              <div className={styles.navNodes} aria-hidden="false">
                {/* Left Rail Nodes */}
                <button
                  type="button"
                  className={`${styles.navNode} ${styles.nodeTime}`}
                  aria-label="時光迴廊（歷史 / 紀錄）"
                  title="時光迴廊"
                  onClick={() => goHash('#history')}
                >
                  ⏱
                </button>
                <button
                  type="button"
                  className={`${styles.navNode} ${styles.nodeSoul}`}
                  aria-label="靈魂共鳴（社群 / 互動）"
                  title="靈魂共鳴"
                  onClick={() => goHash('#community')}
                >
                  💬
                </button>

                {/* Right Rail Nodes */}
                <button
                  type="button"
                  className={`${styles.navNode} ${styles.nodeTools}`}
                  aria-label="時空計畫（工具 / 輔助）"
                  title="時空計畫"
                  onClick={() => goHash('#tools')}
                >
                  🧰
                </button>
                <button
                  type="button"
                  className={`${styles.navNode} ${styles.nodeTuning}`}
                  aria-label="核心調律（設定 / 配置）"
                  title="核心調律"
                  onClick={() => goHash('#settings')}
                >
                  ⚙
                </button>
                <button
                  type="button"
                  className={`${styles.navNode} ${styles.nodeHonor}`}
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
          {foreground}

          {/* Structural Closure: Bottom Pedestal */}
          {navigationEnabled && (
            <div className={styles.pedestalWrapper} ref={pedestalRef}>
              <img className={styles.pedestalImg} src={bottomPedestal} alt="" aria-hidden="true" />

              {/* Trinity Entry Slots (placeholders) */}
              <div className={styles.pedestalSlots} aria-hidden="false">
                <button
                  type="button"
                  className={`${styles.pedestalSlot} ${styles.slotLeft}`}
                  aria-label="左插槽：訓練場（評測專頁）"
                  title="訓練場（評測專頁）"
                  onClick={() => {
                    window.location.hash = '#evaluation';
                  }}
                />
                <button
                  type="button"
                  className={`${styles.pedestalSlot} ${styles.slotCenter}`}
                  aria-label="中插槽：主控台（Home / 雷達圖）"
                  title="主控台"
                  onClick={() => {
                    window.location.hash = '#home';
                  }}
                />
                <button
                  type="button"
                  className={`${styles.pedestalSlot} ${styles.slotRight}`}
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
