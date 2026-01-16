import { useUIStore } from '../../stores/uiStore';
import styles from '../../styles/modules/MagitekChassis.module.css';

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
 * @param {React.ReactNode} children - Content to render in ScrollContent layer
 */
export const MagitekChassis = ({ children }) => {
  const isOverlayVisible = useUIStore((state) => state.isOverlayVisible);
  const activeModals = useUIStore((state) => state.activeModals);

  return (
    <div className={styles.chassis}>
      {/* Background Layer - Ambient effects, decorative elements */}
      <div className={styles.backgroundLayer}>
        {/* Background content can be added here */}
      </div>

      {/* ScrollContent Layer - Main scrollable business logic */}
      <div className={styles.scrollContentLayer}>
        <div className={styles.scrollContent}>
          {children}
        </div>
      </div>

      {/* Foreground Layer - Fixed UI, modals, overlays */}
      <div 
        className={`${styles.foregroundLayer} ${isOverlayVisible ? styles.overlayActive : ''}`}
        aria-hidden={!isOverlayVisible}
      >
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
      </div>
    </div>
  );
};

export default MagitekChassis;
