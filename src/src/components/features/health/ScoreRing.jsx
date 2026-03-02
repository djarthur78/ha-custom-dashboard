/**
 * ScoreRing Component
 * SVG circular gauge with gradient stroke, glow effect, and sub-metrics
 */

import { useEntity } from '../../../hooks/useEntity';
import { getScoreColor } from './healthConfig';

const RING_GRADIENTS = {
  high: { start: '#22c55e', end: '#16a34a' },
  medium: { start: '#fbbf24', end: '#f59e0b' },
  low: { start: '#f87171', end: '#ef4444' },
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

export function ScoreRing({ entityId, label, size = 160, strokeWidth = 14, subMetrics = [] }) {
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
            <filter id={`glow-${label.toLowerCase()}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth - 2}
            opacity={1}
          />
          {/* Progress circle with gradient and glow */}
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
            filter={`url(#glow-${label.toLowerCase()})`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color, letterSpacing: '-1px' }}>
            {loading ? '--' : isValid ? score : '--'}
          </span>
          {isValid && (
            <span className="text-[11px] font-semibold mt-0.5" style={{ color, opacity: 0.8 }}>
              {scoreLabel}
            </span>
          )}
        </div>
      </div>
      <span className="mt-2 text-sm font-bold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</span>
      {/* Sub-metrics */}
      {subMetrics.length > 0 && (
        <div className="mt-2 flex gap-4">
          {subMetrics.map(sub => (
            <SubMetric key={sub.entityId} entityId={sub.entityId} label={sub.label} unit={sub.unit} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubMetric({ entityId, label, unit = '' }) {
  const { state } = useEntity(entityId);
  const val = state && state !== 'unavailable' && state !== 'unknown' ? state : null;
  return (
    <div className="text-center">
      <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {val ?? '--'}{val && unit ? unit : ''}
      </div>
    </div>
  );
}
