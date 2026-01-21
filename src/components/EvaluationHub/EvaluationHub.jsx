import { useCallback, useMemo, useState } from 'react';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import { calculate1RM } from '../../utils/strengthCalculations';
import { AssessmentEntrySection } from './AssessmentEntrySection';
import styles from '../../styles/modules/EvaluationHub.module.css';

/**
 * Evaluation Hub (評測專頁)
 * - Dedicated navigation surface for assessments
 * - Hash sub-routes: `#evaluation/<subPath>`
 *   - home: `#evaluation`
 *   - 1RM: `#evaluation/1rm`
 *   - plates: `#evaluation/plates`
 */
export default function EvaluationHub({ subPath = '' }) {
  useRouteCleanup('evaluation-hub');

  const goHash = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  const section = (subPath || '').toLowerCase();

  return (
    <MagitekChassis>
      <div className={styles.page}>
        {section === '1rm' ? (
          <OneRMSection onBack={() => goHash('#evaluation')} />
        ) : section === 'plates' ? (
          <PlatesSection onBack={() => goHash('#evaluation')} />
        ) : (
          <HubHome
            onOpenOneRM={() => goHash('#evaluation/1rm')}
            onOpenPlates={() => goHash('#evaluation/plates')}
            onOpenStrength={() => goHash('#strength')}
            onOpenCardio={() => goHash('#cardio')}
            onOpenMuscle={() => goHash('#muscle')}
            onOpenFFMI={() => goHash('#ffmi')}
            onOpenExplosive={() => goHash('#explosive')}
          />
        )}
      </div>
    </MagitekChassis>
  );
}

function HubHome({
  onOpenOneRM,
  onOpenPlates,
  onOpenStrength,
  onOpenCardio,
  onOpenMuscle,
  onOpenFFMI,
  onOpenExplosive,
}) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.kicker}>Magitek Evaluation Hub</div>
        <h1 className={styles.title}>評測專頁</h1>
        <p className={styles.subtitle}>
          把評測入口集中管理，底座只保留三位一體節點，不再塞滿導覽。
        </p>
      </header>

      <section className={styles.grid}>
        <button type="button" className={styles.card} onClick={onOpenOneRM}>
          <div className={styles.cardTitle}>🏋️ 1RM 計算</div>
          <div className={styles.cardDesc}>快速估算單次最大重量，並給出常用訓練重量。</div>
        </button>

        <button type="button" className={styles.card} onClick={onOpenPlates}>
          <div className={styles.cardTitle}>🧱 配重配置（Plates）</div>
          <div className={styles.cardDesc}>輸入目標重量，列出每邊該掛哪些槓片。</div>
        </button>
      </section>

      <AssessmentEntrySection
        onOpenStrength={onOpenStrength}
        onOpenCardio={onOpenCardio}
        onOpenMuscle={onOpenMuscle}
        onOpenFFMI={onOpenFFMI}
        onOpenExplosive={onOpenExplosive}
      />

      <section className={styles.note}>
        <div className={styles.noteTitle}>提示</div>
        <div className={styles.noteText}>
          你也可以直接點擊個人頁底座的左/右插槽，快速前往 1RM 與 Plates。
        </div>
      </section>
    </>
  );
}

function OneRMSection({ onBack }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [method, setMethod] = useState('average');

  const parsed = useMemo(() => {
    const w = Number(weight);
    const r = Number(reps);
    const safeW = Number.isFinite(w) && w > 0 ? w : 0;
    const safeR = Number.isFinite(r) && r > 0 ? r : 0;
    const oneRM = safeW > 0 && safeR > 0 ? calculate1RM(safeW, safeR, method) : 0;
    return {
      safeW,
      safeR,
      oneRM,
    };
  }, [weight, reps, method]);

  const displayOneRM = parsed.oneRM > 0 ? `${parsed.oneRM.toFixed(1)} kg` : '—';

  return (
    <>
      <div className={styles.sectionHeader}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← 返回評測專頁
        </button>
        <div className={styles.sectionTitle}>🏋️ 1RM 計算</div>
        <div className={styles.sectionSubtitle}>輸入重量與次數，估算單次最大重量（1RM）。</div>
      </div>

      <section className={styles.panel}>
        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="oneRMWeight">
            重量（kg）
          </label>
          <input
            id="oneRMWeight"
            className={styles.input}
            type="number"
            inputMode="decimal"
            placeholder="例如：100"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="oneRMReps">
            次數（reps）
          </label>
          <input
            id="oneRMReps"
            className={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="例如：5"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="oneRMMethod">
            公式
          </label>
          <select
            id="oneRMMethod"
            className={styles.select}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="average">平均（推薦）</option>
            <option value="epley">Epley</option>
            <option value="brzycki">Brzycki</option>
            <option value="lombardi">Lombardi</option>
          </select>
        </div>

        <div className={styles.resultBox}>
          <div className={styles.resultLabel}>估算 1RM</div>
          <div className={styles.resultValue}>{displayOneRM}</div>
          <div className={styles.resultHint}>
            建議：reps 越高誤差通常越大；若超過 12 reps，請以安全為優先。
          </div>
        </div>
      </section>
    </>
  );
}

function PlatesSection({ onBack }) {
  const [targetTotal, setTargetTotal] = useState('');
  const [barWeight, setBarWeight] = useState('20');

  const plateSet = useMemo(() => [25, 20, 15, 10, 5, 2.5, 1.25], []);

  const result = useMemo(() => {
    const t = Number(targetTotal);
    const b = Number(barWeight);
    const safeT = Number.isFinite(t) && t > 0 ? t : 0;
    const safeB = Number.isFinite(b) && b >= 0 ? b : 0;
    const remainder = safeT - safeB;
    if (safeT <= 0 || remainder <= 0) {
      return { ok: false, perSide: 0, plates: [], leftover: 0 };
    }

    const perSide = remainder / 2;
    if (perSide <= 0) {
      return { ok: false, perSide: 0, plates: [], leftover: 0 };
    }

    let remaining = perSide;
    const picks = [];
    for (const p of plateSet) {
      const count = Math.floor((remaining + 1e-9) / p);
      if (count > 0) {
        picks.push({ plate: p, count });
        remaining = remaining - count * p;
      }
    }

    const roundedLeftover = Math.round(remaining * 100) / 100;
    const ok = roundedLeftover === 0;
    return { ok, perSide, plates: picks, leftover: roundedLeftover };
  }, [targetTotal, barWeight, plateSet]);

  return (
    <>
      <div className={styles.sectionHeader}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← 返回評測專頁
        </button>
        <div className={styles.sectionTitle}>🧱 配重配置（Plates）</div>
        <div className={styles.sectionSubtitle}>輸入總重量與槓鈴重量，列出每邊槓片。</div>
      </div>

      <section className={styles.panel}>
        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="platesTarget">
            目標總重量（kg）
          </label>
          <input
            id="platesTarget"
            className={styles.input}
            type="number"
            inputMode="decimal"
            placeholder="例如：140"
            value={targetTotal}
            onChange={(e) => setTargetTotal(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label className={styles.label} htmlFor="platesBar">
            槓鈴重量（kg）
          </label>
          <input
            id="platesBar"
            className={styles.input}
            type="number"
            inputMode="decimal"
            placeholder="例如：20"
            value={barWeight}
            onChange={(e) => setBarWeight(e.target.value)}
          />
        </div>

        <div className={styles.resultBox}>
          <div className={styles.resultLabel}>每邊目標</div>
          <div className={styles.resultValue}>
            {result.perSide > 0 ? `${result.perSide.toFixed(2)} kg / side` : '—'}
          </div>

          {result.plates.length > 0 ? (
            <div className={styles.plateList}>
              {result.plates.map((p) => (
                <div key={p.plate} className={styles.plateRow}>
                  <div className={styles.plateName}>{p.plate} kg</div>
                  <div className={styles.plateCount}>× {p.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.resultHint}>請輸入可行的目標重量（大於槓鈴重量）。</div>
          )}

          {result.plates.length > 0 && !result.ok && (
            <div className={styles.warning}>
              ⚠️ 以預設槓片組合無法精準湊到目標，每邊尚差 {result.leftover.toFixed(2)} kg
            </div>
          )}
        </div>

        <div className={styles.noteText}>
          預設槓片：25/20/15/10/5/2.5/1.25（kg）。之後若要支援英制或自訂槓片，我會把它抽成可配置設定。
        </div>
      </section>
    </>
  );
}

