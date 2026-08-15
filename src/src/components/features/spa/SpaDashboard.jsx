import { createElement, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bath,
  Clock3,
  Droplets,
  Minus,
  Plus,
  Sparkles,
  SunMedium,
  Trees,
  Waves,
  Wind,
  Thermometer,
} from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { SPA_ENTITIES, SPA_TARGET_PRESETS } from './spaConfig';
import { SpaHistoryCharts } from './SpaHistoryCharts';

function parseNumber(value) {
  if (value == null) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTemp(value, decimals = 1) {
  const parsed = parseNumber(value);
  return parsed == null ? '--' : `${parsed.toFixed(decimals)}°C`;
}

function formatMeasurementTime(timestamps) {
  const latest = timestamps
    .map((value) => (value ? new Date(value) : null))
    .filter((value) => value && Number.isFinite(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!latest) return 'Unavailable';

  return `${latest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${formatDistanceToNow(latest, { addSuffix: true })}`;
}

function getRecommendationList(entity) {
  const recommendations = entity?.attributes?.recommendations;
  return Array.isArray(recommendations) ? recommendations : [];
}

function isRecommendationRelevant(item, { phValue, phMin, phMax, orpValue, orpMin, orpMax }) {
  const title = `${item?.title || ''} ${item?.action || ''}`.toLowerCase();
  if (title.includes('ph minus')) return phValue == null || phValue > phMax;
  if (title.includes('ph plus')) return phValue == null || phValue < phMin;
  if (title.includes('bromine') || title.includes('shock') || title.includes('disinfection')) {
    return orpValue == null || orpValue < orpMin;
  }
  if (title.includes('orp')) return orpValue == null || orpValue < orpMin;
  return true;
}

function recommendationCategory(item) {
  const text = `${item?.title || ''} ${item?.action || ''} ${item?.message || ''}`.toLowerCase();
  if (text.includes('bromine') || text.includes('shock') || text.includes('disinfection')) return 'Bromine';
  if (text.includes('weekly')) return 'Weekly maintenance';
  if (text.includes('orp')) return 'ORP';
  if (text.includes('ph plus') || text.includes('ph minus') || text.includes('ph ')) return 'pH';
  return 'Recommendation';
}

function RecommendationRow({ item }) {
  return (
    <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">
        {recommendationCategory(item)}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--ds-text)]">{item?.title || item?.action || 'Recommendation'}</div>
    </div>
  );
}

function TonePill({ label, tone = 'neutral' }) {
  const palette = {
    good: { bg: 'rgba(74,154,74,0.12)', fg: 'var(--ds-health-good)' },
    warn: { bg: 'rgba(212,148,76,0.14)', fg: 'var(--ds-health-warn)' },
    bad: { bg: 'rgba(196,99,106,0.14)', fg: 'var(--ds-health-bad)' },
    info: { bg: 'rgba(90,143,184,0.14)', fg: 'var(--ds-health-info)' },
    neutral: { bg: 'var(--ds-warm-inactive-bg)', fg: 'var(--ds-warm-inactive-text)' },
  };
  const c = palette[tone] || palette.neutral;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border px-3 py-2" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--ds-text)]">{value}</div>
    </div>
  );
}

function MetricBlock({ label, value, subtext, tone = 'neutral', icon: Icon = null }) {
  const toneMap = {
    good: 'var(--ds-health-good)',
    warn: 'var(--ds-health-warn)',
    bad: 'var(--ds-health-bad)',
    info: 'var(--ds-health-info)',
    neutral: 'var(--ds-text)',
  };

  return (
    <div className="rounded-2xl border bg-white/75 px-3 py-3" style={{ borderColor: 'var(--ds-border)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">{label}</div>
        {Icon && <Icon size={14} className="text-[var(--ds-text-secondary)]" />}
      </div>
      <div className="mt-1 text-[28px] font-bold leading-none" style={{ color: toneMap[tone] || toneMap.neutral }}>
        {value}
      </div>
      {subtext && <div className="mt-1 text-xs leading-relaxed text-[var(--ds-text-secondary)]">{subtext}</div>}
    </div>
  );
}

function deriveChemistrySummary({ relevantRecommendations }) {
  const primaryRecommendation = relevantRecommendations[0] || null;

  if (primaryRecommendation) {
    return {
      verdict: 'ICO action',
      tone: 'info',
      icon: Clock3,
      actionTitle: primaryRecommendation.title || primaryRecommendation.action || 'Review recommendation',
    };
  }

  return {
    verdict: 'No ICO action',
    tone: 'neutral',
    icon: Clock3,
    actionTitle: null,
    actionText: '',
  };
}

function TempHeroCard() {
  const { state: currentTemp } = useEntity(SPA_ENTITIES.currentTemp);
  const { state: targetTemp } = useEntity(SPA_ENTITIES.targetTemp);
  const { state: standbyTemp } = useEntity(SPA_ENTITIES.standbyTemp);
  const { state: heaterState } = useEntity(SPA_ENTITIES.heaterState);
  const { state: status } = useEntity(SPA_ENTITIES.status);
  const { callService, loading } = useServiceCall();

  const currentValue = parseNumber(currentTemp);
  const targetValue = parseNumber(targetTemp);
  const isHeating = String(heaterState || '').toLowerCase().includes('heat') || String(status || '').toLowerCase().includes('heat');
  const statusLabel = isHeating ? 'Heating' : (status || 'Ready / Filtering / Idle');
  const tempRag = currentValue != null && targetValue != null && Math.abs(currentValue - targetValue) <= 1 ? 'good' : (isHeating ? 'warn' : 'neutral');
  const tempRagLabel = currentValue != null && targetValue != null && Math.abs(currentValue - targetValue) <= 1 ? 'Good to use' : (isHeating ? 'Heating' : 'Adjust temp');

  const handleAdjust = async (delta) => {
    if (targetValue == null) return;
    await callService('climate', 'set_temperature', {
      entity_id: SPA_ENTITIES.climate,
      temperature: Math.max(5, Math.min(42, targetValue + delta)),
    });
  };

  const handleReady = async () => {
    await callService('climate', 'set_temperature', {
      entity_id: SPA_ENTITIES.climate,
      temperature: SPA_TARGET_PRESETS.ready,
    });
    await callService('select', 'select_option', {
      entity_id: SPA_ENTITIES.status,
      option: 'READY',
    });
  };

  const handleEco = async () => {
    const standbyValue = parseNumber(standbyTemp);
    if (standbyValue != null) {
      await callService('climate', 'set_temperature', {
        entity_id: SPA_ENTITIES.climate,
        temperature: standbyValue,
      });
    }
    await callService('select', 'select_option', {
      entity_id: SPA_ENTITIES.status,
      option: 'REST',
    });
  };

  return (
    <div className="ds-card flex h-full flex-col overflow-hidden" style={{ padding: 14 }}>
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--ds-border)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Spa</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-[40px] font-bold leading-none text-[var(--ds-text)]">
              {currentValue == null ? '--' : currentValue.toFixed(1)}
            </div>
            <div className="pb-1 text-2xl font-bold leading-none text-[var(--ds-text-secondary)]">°C</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TonePill label={tempRagLabel} tone={tempRag} />
          <Bath size={34} className={isHeating ? 'text-[var(--ds-state-on)]' : 'text-[var(--ds-text-secondary)]'} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col justify-between gap-3 pt-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <TonePill label={statusLabel} tone={isHeating ? 'warn' : 'good'} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Mode" value={statusLabel} />
            <MiniStat label="Heater" value={isHeating ? 'Heating' : 'Idle'} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            onClick={() => handleAdjust(-1)}
            disabled={loading || targetValue == null}
            className="flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-accent)', borderColor: 'var(--ds-border)' }}
          >
            <Minus size={24} />
          </button>
          <div className="min-w-[128px] text-center">
            <div className="text-3xl font-bold leading-none text-[var(--ds-text)]">
              {targetValue == null ? '--' : `${targetValue.toFixed(0)}°`}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Target</div>
          </div>
          <button
            type="button"
            onClick={() => handleAdjust(1)}
            disabled={loading || targetValue == null}
            className="flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-accent)', borderColor: 'var(--ds-border)' }}
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleReady}
            disabled={loading}
            className="rounded-xl px-3 py-3 text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--ds-state-on-bg)', color: 'var(--ds-state-on)' }}
          >
            Ready
          </button>
          <button
            type="button"
            onClick={handleEco}
            disabled={loading}
            className="rounded-xl px-3 py-3 text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-text)' }}
          >
            Eco
          </button>
        </div>
      </div>
    </div>
  );
}

function ChemistryCard() {
  const ph = useEntity(SPA_ENTITIES.waterQualityPh);
  const orp = useEntity(SPA_ENTITIES.waterQualityOrp);
  const icoTemp = useEntity(SPA_ENTITIES.icoTemp);
  const icoBattery = useEntity(SPA_ENTITIES.icoBattery);
  const rec = useEntity(SPA_ENTITIES.icoRecommendation);
  const phMinimum = useEntity(SPA_ENTITIES.phMinimum);
  const phMaximum = useEntity(SPA_ENTITIES.phMaximum);
  const orpMinimum = useEntity(SPA_ENTITIES.orpMinimum);
  const orpMaximum = useEntity(SPA_ENTITIES.orpMaximum);

  const phValue = parseNumber(ph.state);
  const orpValue = parseNumber(orp.state);
  const phMin = parseNumber(phMinimum.state) ?? 7.2;
  const phMax = parseNumber(phMaximum.state) ?? 7.6;
  const orpMin = parseNumber(orpMinimum.state) ?? 550;
  const orpMax = parseNumber(orpMaximum.state) ?? 650;

  const relevantRecommendations = useMemo(
    () => getRecommendationList(rec).filter((item) => isRecommendationRelevant(item, {
      phValue,
      phMin,
      phMax,
      orpValue,
      orpMin,
      orpMax,
    })),
    [rec, phValue, phMin, phMax, orpValue, orpMin, orpMax],
  );

  const summary = deriveChemistrySummary({
    phValue,
    phMin,
    phMax,
    orpValue,
    orpMin,
    orpMax,
    relevantRecommendations,
  });

  const lastMeasurement = formatMeasurementTime([ph.lastUpdated, orp.lastUpdated, icoTemp.lastUpdated]);
  const chemistryTone = relevantRecommendations.length > 0 ? 'warn' : 'good';
  const chemistryLabel = relevantRecommendations.length > 0 ? 'Action needed' : 'Good to use';

  return (
    <div className="ds-card flex h-full flex-col overflow-hidden" style={{ padding: 16 }}>
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--ds-border)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Chemistry</div>
          <h3 className="mt-1 text-base font-bold text-[var(--ds-text)]">ICO guidance</h3>
        </div>
        <div className="flex items-center gap-2">
          <TonePill label={chemistryLabel} tone={chemistryTone} />
          <Clock3 size={18} className="text-[var(--ds-text-secondary)]" />
        </div>
      </div>

      <div className="mt-3 rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Current state</div>
            <div className="mt-1 text-xl font-bold text-[var(--ds-text)]">{summary.verdict}</div>
          </div>
          <summary.icon size={20} className="mt-0.5 shrink-0 text-[var(--ds-text-secondary)]" />
        </div>
        <div className="mt-2 text-xs leading-relaxed text-[var(--ds-text-secondary)]">
          Last ICO measurement: <span className="font-semibold text-[var(--ds-text)]">{lastMeasurement}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3">
        <MetricBlock
          label="pH"
          value={phValue == null ? '--' : phValue.toFixed(2)}
          tone={phValue == null ? 'neutral' : phValue < phMin || phValue > phMax ? 'warn' : 'good'}
          subtext={`Target ${phMin.toFixed(1)}–${phMax.toFixed(1)}`}
          icon={Droplets}
        />
        <MetricBlock
          label="ORP"
          value={orpValue == null ? '--' : `${orpValue.toFixed(0)} mV`}
          tone={orpValue == null ? 'neutral' : orpValue < orpMin || orpValue > orpMax ? 'warn' : 'good'}
          subtext={`Target ${orpMin.toFixed(0)}–${orpMax.toFixed(0)} mV`}
        />
        <MetricBlock
          label="ICO temp"
          value={formatTemp(icoTemp.state)}
          tone="info"
          subtext="Independent water monitoring"
          icon={Thermometer}
        />
        <MetricBlock
          label="Battery"
          value={icoBattery.state || '--'}
          tone={icoBattery.state != null && parseNumber(icoBattery.state) != null && parseNumber(icoBattery.state) < 25 ? 'warn' : 'neutral'}
          subtext="ICO status"
        />
      </div>

      {summary.actionTitle && (
        <div className="mt-3 flex-1 min-h-0 rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--ds-border)' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Next steps</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">
              {Math.min(relevantRecommendations.length, 3)} shown
            </div>
          </div>
          <div className="mt-2 max-h-[120px] space-y-2 overflow-y-auto pr-1">
            {relevantRecommendations.slice(0, 3).map((item, index) => (
              <RecommendationRow key={`${item.title || item.action || index}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ControlButton({ icon: ButtonIcon, label, entityId }) {
  const { state } = useEntity(entityId);
  const { toggle, loading } = useServiceCall();
  const isOn = state === 'on' || state === 'HIGH';

  const handleClick = async () => {
    if (!entityId) return;
    await toggle(entityId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!entityId || loading}
      className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all disabled:opacity-40"
      style={{
        backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)',
        color: isOn ? 'white' : 'var(--ds-warm-inactive-text)',
      }}
    >
      {createElement(ButtonIcon, { size: 24 })}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function OutdoorLightButton({ icon: ButtonIcon, label, entityId, note }) {
  const { state } = useEntity(entityId);
  const { toggle, loading } = useServiceCall();
  const isOn = state === 'on';

  const handleClick = async () => {
    if (!entityId) return;
    await toggle(entityId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!entityId || loading}
      className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all disabled:opacity-55"
      style={{
        backgroundColor: entityId ? (isOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)') : 'rgba(255,255,255,0.55)',
        color: entityId ? (isOn ? 'white' : 'var(--ds-warm-inactive-text)') : 'var(--ds-text-secondary)',
      }}
      title={entityId ? label : `${label} light is not mapped in Home Assistant`}
    >
      {createElement(ButtonIcon, { size: 24 })}
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider">{note}</span>
    </button>
  );
}

function SpaControlsCard() {
  return (
    <div className="ds-card flex flex-col" style={{ padding: 14 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Spa Controls</h3>
        <Waves size={18} className="text-[var(--ds-text-secondary)]" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 pt-3">
        <ControlButton icon={Sparkles} label="Jets 1" entityId={SPA_ENTITIES.jets1} />
        <ControlButton icon={Sparkles} label="Jets 2" entityId={SPA_ENTITIES.jets2} />
        <ControlButton icon={Wind} label="Blower" entityId={SPA_ENTITIES.blower} />
        <ControlButton icon={SunMedium} label="Lights" entityId={SPA_ENTITIES.lights} />
      </div>
    </div>
  );
}

function OutdoorLightsCard() {
  const outdoorLights = [
    { label: 'Games Room', entityId: SPA_ENTITIES.outdoorGamesRoom, icon: Trees, note: 'Outdoor' },
    {
      label: 'Gazebo',
      entityId: SPA_ENTITIES.outdoorGazebo,
      icon: SunMedium,
      note: SPA_ENTITIES.outdoorGazebo ? 'Outdoor' : 'Not mapped',
    },
  ];

  return (
    <div className="ds-card flex flex-col" style={{ padding: 14 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Outdoor Lights</h3>
        <Trees size={18} className="text-[var(--ds-text-secondary)]" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3">
        {outdoorLights.map(({ label, entityId, icon: Icon, note }) => (
          <OutdoorLightButton key={label} icon={Icon} label={label} entityId={entityId} note={note} />
        ))}
      </div>
    </div>
  );
}

function SpaSystemCard() {
  const { state: heaterState } = useEntity(SPA_ENTITIES.heaterState);
  const { state: status } = useEntity(SPA_ENTITIES.status);
  const { state: online } = useEntity(SPA_ENTITIES.online);
  const { state: standbyTemp } = useEntity(SPA_ENTITIES.standbyTemp);
  const { state: icoBattery } = useEntity(SPA_ENTITIES.icoBattery);
  const isHeating = String(heaterState || '').toLowerCase().includes('heat') || String(status || '').toLowerCase().includes('heat');

  return (
    <div className="ds-card flex flex-col" style={{ padding: 14 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Spa System</h3>
        <Clock3 size={18} className="text-[var(--ds-text-secondary)]" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3">
        <MiniStat label="Online" value={online === 'on' ? 'Yes' : 'No'} />
        <MiniStat label="Heater" value={isHeating ? 'Heating' : 'Idle'} />
        <MiniStat label="Standby" value={standbyTemp ? `${Number.parseFloat(standbyTemp).toFixed(0)}°` : '--'} />
        <MiniStat label="ICO battery" value={icoBattery || '--'} />
      </div>
    </div>
  );
}

export function SpaDashboard() {
  return (
    <div className="flex flex-col gap-1.5 p-2 md:h-[calc(100vh-72px)] md:overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
        <div className="flex min-h-0 flex-[60] flex-col gap-2">
          <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
            <TempHeroCard />
            <ChemistryCard />
          </div>
          <div className="min-h-0 flex-1">
            <SpaHistoryCharts />
          </div>
        </div>

        <div className="flex min-h-0 flex-[40] flex-col gap-2">
          <SpaControlsCard />
          <OutdoorLightsCard />
          <SpaSystemCard />
        </div>
      </div>
    </div>
  );
}

export default SpaDashboard;
