import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import hudStyles from '../../styles/modules/MagitekHUD.module.css';

// MagitekHUD SSOT: keep this module pure + auditable
export const MagitekHUD = ({ user }) => {
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const [marquee, setMarquee] = useState({ active: false, shiftPx: 0, durationS: 0 });

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const textEl = textRef.current;
    if (!viewport || !textEl) return;

    const viewportWidth = viewport.clientWidth || 0;
    const textWidth = textEl.scrollWidth || 0;
    const overflowPx = Math.max(0, Math.ceil(textWidth - viewportWidth));

    if (overflowPx > 1) {
      // Smart Marquee v2: slow, smooth scroll (~16px/s), clamped for UX stability
      const durationS = Math.min(28, Math.max(10, overflowPx / 16));
      setMarquee((prev) => {
        if (prev.active && prev.shiftPx === overflowPx && prev.durationS === durationS) return prev;
        return { active: true, shiftPx: overflowPx, durationS };
      });
      return;
    }

    setMarquee((prev) => (prev.active ? { active: false, shiftPx: 0, durationS: 0 } : prev));
  }, []);

  useLayoutEffect(() => {
    const raf = window.requestAnimationFrame(measure);
    const fontsReady = window?.document?.fonts?.ready;
    if (fontsReady && typeof fontsReady.then === 'function') {
      fontsReady.then(measure).catch(() => {});
    }
    return () => window.cancelAnimationFrame(raf);
  }, [measure, user?.combatPower, user?.nickname]);

  useLayoutEffect(() => {
    if (!viewportRef.current || typeof window.ResizeObserver !== 'function') return;

    const ro = new window.ResizeObserver(() => measure());
    ro.observe(viewportRef.current);
    if (textRef.current) ro.observe(textRef.current);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className={hudStyles.centerScreen} aria-label="身分插槽">
      <div className={hudStyles.identitySlot} aria-label="身分資訊">
        <div
          className={`${hudStyles.identityViewport} ${marquee.active ? hudStyles.identityViewportMasked : ''}`}
          ref={viewportRef}
        >
          <span
            ref={textRef}
            className={`${hudStyles.identityLine} ${
              marquee.active ? hudStyles.identityLineScroll : hudStyles.identityLineBreath
            }`}
            style={
              marquee.active
                ? {
                    '--identity-marquee-shift': `${marquee.shiftPx}px`,
                    '--identity-marquee-duration': `${marquee.durationS}s`,
                  }
                : undefined
            }
          >
            <span className={hudStyles.identityPrefix}>[{user?.combatPower ?? 0}]</span>
            <span className={hudStyles.identityName}>{user?.nickname || 'UserNickname'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MagitekHUD;

