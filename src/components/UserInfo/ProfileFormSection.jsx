import { UserFormSection } from './UserFormSection';

/**
 * Profile Form Section (Slice B)
 * Thin wrapper around `UserFormSection` to finalize component boundaries:
 * - AvatarSection (HUD window)
 * - RadarChartSection (data visualization)
 * - ProfileFormSection (profile edit + save)
 */
export const ProfileFormSection = () => {
  return <UserFormSection />;
};

export default ProfileFormSection;

