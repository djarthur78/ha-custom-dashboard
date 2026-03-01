/**
 * ScoreRing Component
 * SVG circular gauge for displaying Oura Ring scores
 */

import { useEntity } from '../../../hooks/useEntity';
import { getScoreColor } from './healthConfig';

export function ScoreRing({ entityId, label, size = 160, strokeWidth = 12, subMetrics = [] }) {
  const { state, loading } = useEntity(entityId);
  const score = parseInt(state, 10);
  const isValid = !isNaN(score);
  const color = getScoreColor(score);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = isValid ? (score / 100) * circumference : 0;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {loading ? '--' : isValid ? score : '--'}
          </span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold text-[var(--color-text)]">{label}</span>
      {/* Sub-metrics */}
      {subMetrics.length > 0 && (
        <div className="mt-2 flex gap-3">
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
  return (
    <div className="text-center">
      <div className="text-xs text-[var(--color-text-secondary)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--color-text)]">
        {state ?? '--'}{unit}
      </div>
    </div>
  );
}
