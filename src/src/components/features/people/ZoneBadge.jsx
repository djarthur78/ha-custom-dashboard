import { Home, GraduationCap, Briefcase, MapPin } from 'lucide-react';
import { ZONE_BADGE_COLORS, ZONE_LABELS } from './peopleConfig';

const ZONE_ICONS = {
  home: Home,
  school: GraduationCap,
  ec3a: Briefcase,
  not_home: MapPin
};

/**
 * Zone Badge Component
 * Shows current zone with icon and label
 */
export function ZoneBadge({ zone }) {
  if (!zone) {
    zone = 'not_home';
  }

  const zoneKey = zone.toLowerCase();
  const colorClass = ZONE_BADGE_COLORS[zoneKey] || ZONE_BADGE_COLORS.not_home;
  const label = ZONE_LABELS[zoneKey] || zone;
  const Icon = ZONE_ICONS[zoneKey] || MapPin;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
}
