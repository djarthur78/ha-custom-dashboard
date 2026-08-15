import { createElement, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bath,
  CheckCircle2,
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

const RECOMMENDATION_MAX_AGE_MS = 30 * 60 * 1000;
const COMPLETED_RECOMMENDATION_STATES = new Set([
  'cancelled',
  'closed',
  'complete',
  'completed',
  'done',
  'ok',
  'resolved',
  'validated',
]);

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

function recommendationIsActive(item) {
  const status = String(item?.status || '').trim().toLowerCase();
  return !status || !COMPLETED_RECOMMENDATION_STATES.has(status);
}

function recommendationDataIsFresh(entity) {
  const timestamp = entity?.attributes?.refreshed_at || entity?.lastUpdated;
  if (!timestamp) return true;
  const refreshedAt = new Date(timestamp).getTime();
  return Number.isFinite(refreshedAt) && Date.now() - refreshedAt <= RECOMMENDATION_MAX_AGE_MS;
}

function getRecommendationList(entity) {
  const recommendations = entity?.attributes?.recommendations;
  if (!Array.isArray(recommendations) || !recommendationDataIsFresh(entity)) return [];
  return recommendations.filter(recommendationIsActive);
}

function isRecommendationRelevant(item, { phValue, phMin, phMax, orpValue, orpMin }) {
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
    <div className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">
        {recommendationCategory(item)}
      </div>
      <div className="mt-1 text-base font-semibold leading-snug text-[var(--ds-text)]">
        {item?.title || item?.action || 'Recommendation'}
      </div>
    </div>
  );
}

function StatusBubble({ label, value, tone = 'neutral', icon: Icon }) {
  const palette = {
    good: { bg: 'rgba(74,154,74,0.15)', border: 'rgba(74,154,74,0.35)', fg: 'var(--ds-health-good)' },
    warn: { bg: 'rgba(212,148,76,0.17)', border: 'rgba(212,148,76,0.38)', fg: '#a96821' },
    bad: { bg: 'rgba(196,99,106,0.16)', border: 'rgba(196,99,106,0.38)', fg: 'var(--ds-health-bad)' },
    info: { bg: 'rgba(90,143,184,0.15)', border: 'rgba(90,143,184,0.35)', fg: 'var(--ds-health-info)' },
    neutral: { bg: 'var(--ds-warm-inactive-bg)', border: 'var(--ds-border)', fg: 'var(--ds-warm-inactive-text)' },
  };
  const color = palette[tone] || palette.neutral;

  return (
    <div
      className="flex min-w-0 items-center gap-4 rounded-[28px] border px-5 py-4"
      style={{ backgroundColor: color.bg, borderColor: color.border, color: color.fg }}
    >
      {Icon && <Icon size={38} className="shrink-0" />}
      <div className="min-w-0">
        <div className="text-sm font-bold uppercase tracking-wider">{label}</div>
        <div className="mt-0.5 text-[42px] font-bold leading-none tracking-normal">{value}</div>
      </div>
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
    <div className="flex min-h-0 flex-col justify-center rounded-2xl border bg-white/80 px-4 py-3" style={{ borderColor: 'var(--ds-border)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">{label}</div>
        {Icon && <Icon size={16} className="text-[var(--ds-text-secondary)]" />}
      </div>
      <div className="mt-1 text-[30px] font-bold leading-none tracking-normal" style={{ color: toneMap[tone] || toneMap.neutral }}>
        {value}
      </div>
      {subtext && <div className="mt-1.5 text-sm leading-snug text-[var(--ds-text-secondary)]">{subtext}</div>}
    </div>
  );
}

function ControlButton({ icon: ButtonIcon, label, entityId, note }) {
  const { state } = useEntity(entityId);
  const { toggle, loading } = useServiceCall();
  const isOn = state === 'on' || state === 'HIGH';

  return (
    <button
      type="button"
      onClick={() => entityId && toggle(entityId)}
      disabled={!entityId || loading}
      className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-45"
      style={{
        backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)',
        color: isOn ? 'white' : 'var(--ds-warm-inactive-text)',
        borderColor: isOn ? 'var(--ds-state-on)' : '#d5d0cd',
      }}
    >
      {createElement(ButtonIcon, { size: 25 })}
      <span className="text-sm font-semibold">{label}</span>
      {note && <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{note}</span>}
    </button>
  );
}

function TempHeroCard() {
  const { state: currentTemp } = useEntity(SPA_ENTITIES.currentTemp);
  const { state: targetTemp } = useEntity(SPA_ENTITIES.targetTemp);
  const { state: standbyTemp } = useEntity(SPA_ENTITIES.standbyTemp);
  const { state: heaterState } = useEntity(SPA_ENTITIES.heaterState);
  const { state: status } = useEntity(SPA_ENTITIES.status);
  const { state: online } = useEntity(SPA_ENTITIES.online);
  const { callService, loading } = useServiceCall();

  const currentValue = parseNumber(currentTemp);
  const targetValue = parseNumber(targetTemp);
  const isHeating = String(heaterState || '').toLowerCase().includes('heat') || String(status || '').toLowerCase().includes('heat');
  const isReady = currentValue != null && targetValue != null && Math.abs(currentValue - targetValue) <= 1;
  const statusLabel = isHeating ? 'Heating' : (status || 'Ready');
  const temperatureTone = isReady ? 'good' : (isHeating ? 'warn' : 'info');
  const temperatureLabel = isReady ? 'Good to use' : (isHeating ? 'Heating' : 'Temperature');

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

  const controls = [
    { icon: Sparkles, label: 'Jets 1', entityId: SPA_ENTITIES.jets1 },
    { icon: Sparkles, label: 'Jets 2', entityId: SPA_ENTITIES.jets2 },
    { icon: Wind, label: 'Blower', entityId: SPA_ENTITIES.blower },
    { icon: SunMedium, label: 'Spa lights', entityId: SPA_ENTITIES.lights },
    { icon: Trees, label: 'Games Room Lights', entityId: SPA_ENTITIES.outdoorGamesRoom, note: 'Outdoor' },
  ];

  return (
    <section className="ds-card flex h-full min-h-0 flex-col overflow-hidden" style={{ padding: 18 }}>
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Spa</div>
          <h2 className="mt-0.5 text-xl font-bold text-[var(--ds-text)]">Temperature & controls</h2>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ds-text-secondary)]">
          <span className={`h-2.5 w-2.5 rounded-full ${online === 'on' ? 'bg-[var(--ds-health-good)]' : 'bg-[var(--ds-health-bad)]'}`} />
          {online === 'on' ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 py-4 sm:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="flex min-w-0 flex-col justify-center">
          <StatusBubble
            label={temperatureLabel}
            value={currentValue == null ? '--' : `${currentValue.toFixed(1)}°C`}
            tone={temperatureTone}
            icon={Bath}
          />
          <div className="mt-3 flex items-center justify-between gap-3 px-1 text-sm text-[var(--ds-text-secondary)]">
            <span><strong className="text-[var(--ds-text)]">{statusLabel}</strong> · Heater {isHeating ? 'active' : 'idle'}</span>
            <span>{isReady ? 'Within 1°C of target' : 'Outside ready range'}</span>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border bg-white/75 px-4 py-3" style={{ borderColor: 'var(--ds-border)' }}>
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Target temperature</div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Lower spa target temperature"
              onClick={() => handleAdjust(-1)}
              disabled={loading || targetValue == null}
              className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all disabled:opacity-40"
              style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-accent)', borderColor: 'var(--ds-border)' }}
            >
              <Minus size={25} />
            </button>
            <div className="min-w-[86px] text-center text-[38px] font-bold leading-none tracking-normal text-[var(--ds-text)]">
              {targetValue == null ? '--' : `${targetValue.toFixed(0)}°`}
            </div>
            <button
              type="button"
              aria-label="Raise spa target temperature"
              onClick={() => handleAdjust(1)}
              disabled={loading || targetValue == null}
              className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all disabled:opacity-40"
              style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-accent)', borderColor: 'var(--ds-border)' }}
            >
              <Plus size={25} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={handleReady} disabled={loading} className="rounded-xl py-2.5 text-sm font-bold transition-all" style={{ backgroundColor: 'var(--ds-state-on-bg)', color: 'var(--ds-state-on)' }}>Ready 38°</button>
            <button type="button" onClick={handleEco} disabled={loading} className="rounded-xl py-2.5 text-sm font-bold transition-all" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-text)' }}>Eco</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {controls.map((control) => <ControlButton key={control.label} {...control} />)}
      </div>
    </section>
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
  const recommendationFresh = recommendationDataIsFresh(rec);

  const relevantRecommendations = useMemo(
    () => getRecommendationList(rec).filter((item) => isRecommendationRelevant(item, {
      phValue,
      phMin,
      phMax,
      orpValue,
      orpMin,
    })),
    [rec, phValue, phMin, phMax, orpValue, orpMin],
  );

  const lastMeasurement = formatMeasurementTime([ph.lastUpdated, orp.lastUpdated, icoTemp.lastUpdated]);
  const hasAction = relevantRecommendations.length > 0;
  const readingsOutsideRange = (phValue != null && (phValue < phMin || phValue > phMax))
    || (orpValue != null && (orpValue < orpMin || orpValue > orpMax));
  const chemistryTone = !recommendationFresh ? 'info' : (hasAction || readingsOutsideRange ? 'warn' : 'good');
  const chemistryLabel = !recommendationFresh ? 'Checking ICO' : (hasAction ? 'Action needed' : (readingsOutsideRange ? 'Watch levels' : 'Good to use'));
  const chemistryValue = !recommendationFresh
    ? 'Refreshing'
    : (hasAction ? `${relevantRecommendations.length} ${relevantRecommendations.length === 1 ? 'task' : 'tasks'}` : (readingsOutsideRange ? 'No ICO task' : 'No tasks'));

  return (
    <section className="ds-card flex h-full min-h-0 flex-col overflow-hidden" style={{ padding: 18 }}>
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Chemistry</div>
          <h2 className="mt-0.5 text-xl font-bold text-[var(--ds-text)]">ICO water quality</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]">
          <Clock3 size={17} />
          Last reading {lastMeasurement}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 py-4 sm:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.15fr)]">
        <div className={`flex min-w-0 flex-col gap-3 ${hasAction ? '' : 'justify-center'}`}>
          <StatusBubble label={chemistryLabel} value={chemistryValue} tone={chemistryTone} icon={hasAction ? Droplets : CheckCircle2} />
          {hasAction && (
            <div className="min-h-0 flex-1 rounded-2xl border p-3" style={{ borderColor: 'var(--ds-border)' }}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Active ICO tasks</div>
                <div className="text-xs font-semibold text-[var(--ds-text-secondary)]">{Math.min(relevantRecommendations.length, 3)} shown</div>
              </div>
              <div className="max-h-[132px] space-y-2 overflow-y-auto pr-1">
                {relevantRecommendations.slice(0, 3).map((item, index) => (
                  <RecommendationRow key={`${item.id || item.title || item.action || index}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid min-h-0 grid-cols-2 gap-2">
          <MetricBlock
            label="pH"
            value={phValue == null ? '--' : phValue.toFixed(2)}
            tone={phValue == null ? 'neutral' : phValue < phMin || phValue > phMax ? 'warn' : 'good'}
            subtext={`Good range ${phMin.toFixed(1)}–${phMax.toFixed(1)}`}
            icon={Droplets}
          />
          <MetricBlock
            label="Disinfection"
            value={orpValue == null ? '--' : `${orpValue.toFixed(0)} mV`}
            tone={orpValue == null ? 'neutral' : orpValue < orpMin || orpValue > orpMax ? 'warn' : 'good'}
            subtext={`Good range ${orpMin.toFixed(0)}–${orpMax.toFixed(0)} mV`}
            icon={Waves}
          />
          <MetricBlock label="ICO temperature" value={formatTemp(icoTemp.state)} tone="info" subtext="Independent reading" icon={Thermometer} />
          <MetricBlock
            label="ICO battery"
            value={icoBattery.state == null ? '--' : `${icoBattery.state}%`}
            tone={parseNumber(icoBattery.state) != null && parseNumber(icoBattery.state) < 25 ? 'warn' : 'good'}
            subtext="Monitor status"
            icon={Sparkles}
          />
        </div>
      </div>
    </section>
  );
}

export function SpaDashboard() {
  return (
    <main className="flex flex-col gap-2 p-2 lg:h-[calc(100vh-72px)] lg:overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-rows-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="grid min-h-0 grid-cols-1 gap-2 xl:grid-cols-2">
          <TempHeroCard />
          <ChemistryCard />
        </div>
        <div className="min-h-0">
          <SpaHistoryCharts />
        </div>
      </div>
    </main>
  );
}

export default SpaDashboard;
