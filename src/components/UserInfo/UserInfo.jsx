import UserInfoPage from './UserInfoPage';

/**
 * Main UserInfo Component
 * Rebuilt following Magitek 2.0 standards
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Replaces legacy UserInfo/index.jsx with modular architecture
 * 
 * Structure:
 * - AvatarSection: User avatar and basic info
 * - RadarChartSection: Fitness metrics visualization
 * - UserFormSection: Profile form with Zero-Trust validation
 * - SettingsModals: Privacy and notification settings
 */
export const UserInfo = () => {
  // Keep the legacy export path stable for AppRoutes.
  // The new implementation lives in `UserInfoPage.jsx`.
  return <UserInfoPage />;
};

export default UserInfo;
