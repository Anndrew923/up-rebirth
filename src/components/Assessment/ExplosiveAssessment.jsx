import PowerPage from './Power/PowerPage';

/**
 * Explosive Assessment (Rebirth)
 * Canonical entry for explosive power assessment.
 *
 * NOTE:
 * - Retains "Limit Break" scoring (raw score may exceed 100)
 * - UI is already wrapped by MagitekChassis inside PowerPage
 */
export default function ExplosiveAssessment(props) {
  return <PowerPage {...props} />;
}

