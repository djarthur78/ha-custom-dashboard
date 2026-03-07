/**
 * ScoreRing Component
 * Compact SVG circular gauge for light background
 */

import { useEntity } from '../../../hooks/useEntity';
import { getScoreColor } from './healthConfig';

const RING_GRADIENTS = {
  high: { start: '#4a9a4a', end: '#3a8a3a' },
  medium: { start: '#d4944c', end: '#c4843c' },
  low: { start: '#c4636a', end: '#b4535a' },
  unknown: { start: '#9ca3af', end: '#6b7280' },
};

function getGradientRange(score) {
  const num = parseInt(score, 10);
  if (isNaN(num)) return RING_GRADIENTS.unknown;
  if (num >= 80) return RING_GRADIENTS.high;
  if (num >= 60) return RING_GRADIENTS.medium;
  return RING_GRADIENTS.low;
}

function getScoreLabel(score) {
  const num = parseInt(score, 10);
  if (isNaN(num)) return '';
  if (num >= 85) return 'Optimal';
  if (num >= 70) return 'Good';
  if (num >= 60) return 'Fair';
  return 'Low';
}

export function ScoreRing({ entityId, label, size = 110, strokeWidth = 10 }) {
  const { state, loading } = useEntity(entityId);
  const score = parseInt(state, 10);
  const isValid = !isNaN(score);
  const color = getScoreColor(score);
  const gradient = getGradientRange(score);
  const scoreLabel = getScoreLabel(score);
  const gradientId = `gradient-${label.toLowerCase()}`;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = isValid ? (score / 100) * circumference : 0;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth - 2}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color, letterSpacing: '-1px' }}>
            {loading ? '--' : isValid ? score : '--'}
          </span>
          {isValid && (
            <span className="text-[9px] font-semibold" style={{ color, opacity: 0.8 }}>
              {scoreLabel}
            </span>
          )}
        </div>
      </div>
      <span className="mt-1 text-xs font-bold tracking-wide uppercase text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}
