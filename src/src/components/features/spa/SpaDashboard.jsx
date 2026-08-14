import { createElement, useMemo } from 'react';
import {
  Bath,
  Minus,
  Plus,
  Wind,
  SunMedium,
  Waves,
  ShieldAlert,
  Sparkles,
  Play,
  Pause,
  Volume2,
  Trees,
  CircleAlert,
} from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { SPA_ENTITIES, SPA_TARGET_PRESETS } from './spaConfig';
import { SpaHistoryCharts } from './SpaHistoryCharts';

function parseNumber(value) {
  if (value == null) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function formatTemp(value) {
  const n = parseNumber(value);
  return n == null ? '--' : `${n.toFixed(1)}°`;
}

function formatDifference(value, unit = '', decimals = 2) {
  if (value == null) return '--';
  return `${Math.abs(value).toFixed(decimals)}${unit} ${value > 0 ? 'high' : 'low'}`;
}

function getRecommendationList(entity) {
  const recommendations = entity?.attributes?.recommendations;
  return Array.isArray(recommendations) ? recommendations : [];
}

function conciseRecommendation(item) {
  const message = String(item?.message || '').trim();
  if (!message) return item?.action || '';
  const firstParagraph = message.split(/\n\s*\n/)[0].trim();
  if (/pH Minus/i.test(item?.title || '') || /pH Minus/i.test(item?.action || '')) {
    return `${firstParagraph} Add gradually, follow the product label, and let ICO reassess before adding more.`;
  }
  if (/bromine shock/i.test(item?.title || '') || /bromine shock/i.test(item?.action || '')) {
    return `${firstParagraph} Adjust pH first, then run filtration for a few hours.`;
  }
  return firstParagraph;
}

function StatusChip({ label, active = false, tone = 'neutral' }) {
  const palette = {
    neutral: active ? { bg: 'var(--ds-state-on-bg)', fg: 'var(--ds-state-on)' } : { bg: 'var(--ds-warm-inactive-bg)', fg: 'var(--ds-warm-inactive-text)' },
    warn: active ? { bg: 'rgba(212,148,76,0.14)', fg: 'var(--ds-health-warn)' } : { bg: 'var(--ds-warm-inactive-bg)', fg: 'var(--ds-warm-inactive-text)' },
    bad: active ? { bg: 'rgba(196,99,106,0.14)', fg: 'var(--ds-health-bad)' } : { bg: 'var(--ds-warm-inactive-bg)', fg: 'var(--ds-warm-inactive-text)' },
    info: active ? { bg: 'rgba(90,143,184,0.14)', fg: 'var(--ds-health-info)' } : { bg: 'var(--ds-warm-inactive-bg)', fg: 'var(--ds-warm-inactive-text)' },
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

function LargeTempCard() {
  const { state: currentTemp } = useEntity(SPA_ENTITIES.currentTemp);
  const { state: targetTemp } = useEntity(SPA_ENTITIES.targetTemp);
  const { state: heaterState } = useEntity(SPA_ENTITIES.heaterState);
  const { state: status } = useEntity(SPA_ENTITIES.status);
  const { callService, loading } = useServiceCall();

  const target = parseNumber(targetTemp);
  const isHeating = String(heaterState || '').toLowerCase().includes('heat') || String(status || '').toLowerCase().includes('heat');

  const handleAdjust = async (delta) => {
    if (target == null) return;
    await callService('climate', 'set_temperature', {
      entity_id: SPA_ENTITIES.climate,
      temperature: Math.max(5, Math.min(42, target + delta)),
    });
  };

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden" style={{ padding: 16 }}>
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--ds-border)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-text-secondary)]">Spa</div>
          <div className="mt-1 text-[32px] font-bold leading-none text-[var(--ds-text)]">
            {formatTemp(currentTemp)}
          </div>
        </div>
        <Bath size={30} className={isHeating ? 'text-[var(--ds-state-on)]' : 'text-[var(--ds-text-secondary)]'} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 pt-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusChip label={status || 'Idle'} active tone={isHeating ? 'warn' : 'neutral'} />
            <StatusChip label={`Target ${formatTemp(targetTemp)}`} active tone="info" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ds-text-secondary)]">
            <span>Balboa temperature</span>
            <span>•</span>
            <span>{isHeating ? 'Heating' : 'Ready / Filtering / Idle'}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => handleAdjust(-1)}
            disabled={loading || target == null}
            className="flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-accent)', borderColor: 'var(--ds-border)' }}
          >
            <Minus size={24} />
          </button>
          <div className="text-center min-w-[120px]">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--ds-text-secondary)]">Target</div>
            <div className="text-3xl font-bold leading-none text-[var(--ds-text)]">{target == null ? '--' : `${target.toFixed(0)}°`}</div>
          </div>
          <button
            onClick={() => handleAdjust(1)}
            disabled={loading || target == null}
            className="flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-accent)', borderColor: 'var(--ds-border)' }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

function WaterQualityCard() {
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
  const recommendation = rec.attributes?.summary || null;

  const phTone = phValue == null ? 'neutral' : (phValue < phMin || phValue > phMax ? 'bad' : 'neutral');
  const orpTone = orpValue == null ? 'neutral' : (orpValue < orpMin || orpValue > orpMax ? 'warn' : 'neutral');

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: 16 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Water Quality</h3>
        <ShieldAlert size={18} className="text-[var(--ds-text-secondary)]" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--ds-text-secondary)]">pH</div>
          <div className="mt-1 text-2xl font-bold text-[var(--ds-text)]">{phValue == null ? '--' : phValue.toFixed(2)}</div>
          <StatusChip label={phValue == null ? 'Unavailable' : phTone === 'bad' ? 'Needs attention' : 'Normal'} tone={phTone} active />
          <div className="mt-1 text-xs text-[var(--ds-text-secondary)]">
            Target {phMin.toFixed(1)}–{phMax.toFixed(1)}{phValue != null && phTone === 'bad' ? ` · ${formatDifference(phValue - (phValue > phMax ? phMax : phMin))}` : ''}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--ds-text-secondary)]">ORP / Bromine</div>
          <div className="mt-1 text-2xl font-bold text-[var(--ds-text)]">{orpValue == null ? '--' : `${orpValue.toFixed(0)} mV`}</div>
          <StatusChip label={orpValue == null ? 'Unavailable' : orpTone === 'warn' ? 'Needs attention' : 'Normal'} tone={orpTone} active />
          <div className="mt-1 text-xs text-[var(--ds-text-secondary)]">
            Target {orpMin.toFixed(0)}–{orpMax.toFixed(0)} mV{orpValue != null && orpTone === 'warn' ? ` · ${formatDifference(orpValue - (orpValue > orpMax ? orpMax : orpMin), ' mV', 0)}` : ''}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--ds-text-secondary)]">ICO Temp</div>
          <div className="mt-1 text-2xl font-bold text-[var(--ds-text)]">{formatTemp(icoTemp.state)}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--ds-text-secondary)]">Battery</div>
          <div className="mt-1 text-2xl font-bold text-[var(--ds-text)]">{icoBattery.state || '--'}</div>
        </div>
      </div>

      {recommendation && (
        <div className="mt-3 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
          <span className="font-semibold text-[var(--ds-text)]">ICO:</span>{' '}
          <span className="text-[var(--ds-text-secondary)]">{recommendation}</span>
        </div>
      )}
    </div>
  );
}

function IcoActionCard() {
  const ph = useEntity(SPA_ENTITIES.waterQualityPh);
  const orp = useEntity(SPA_ENTITIES.waterQualityOrp);
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
  const recommendations = getRecommendationList(rec);
  const fallbackActions = [];

  if (phValue != null && phValue > phMax) fallbackActions.push({ title: 'Lower pH gradually', action: `pH is ${formatDifference(phValue - phMax)} outside your target. Add pH Minus gradually, following the product label.` });
  if (phValue != null && phValue < phMin) fallbackActions.push({ title: 'Raise pH gradually', action: `pH is ${formatDifference(phValue - phMin)} outside your target. Add pH Plus gradually, following the product label.` });
  if (orpValue != null && orpValue < orpMin) fallbackActions.push({ title: 'Check bromine treatment', action: `ORP is ${formatDifference(orpValue - orpMin, ' mV', 0)} below the configured disinfection range. Follow the ICO or product instructions for bromine treatment.` });
  if (orpValue != null && orpValue > orpMax) fallbackActions.push({ title: 'Pause extra bromine', action: `ORP is ${formatDifference(orpValue - orpMax, ' mV', 0)} above the configured range. Do not add more disinfectant until it returns to range.` });

  const actions = recommendations.length > 0 ? recommendations : fallbackActions;
  if (actions.length === 0) return null;

  return (
    <div className="ds-card flex h-full flex-col" style={{ padding: 16, backgroundColor: 'rgba(212,148,76,0.08)', borderColor: 'rgba(212,148,76,0.28)' }}>
      <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'rgba(212,148,76,0.25)' }}>
        <CircleAlert size={18} className="text-[var(--ds-health-warn)]" />
        <div>
          <h3 className="text-base font-bold text-[var(--ds-text)]">ICO action</h3>
          <p className="text-xs text-[var(--ds-text-secondary)]">What to do next, based on your configured targets</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-3">
        {actions.map((item, index) => (
          <div key={`${item.title}-${index}`} className="rounded-xl border bg-white/60 px-3 py-2.5" style={{ borderColor: 'rgba(212,148,76,0.25)' }}>
            <div className="text-sm font-bold text-[var(--ds-text)]">{item.title}</div>
            <div className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--ds-text-secondary)]">{conciseRecommendation(item)}</div>
          </div>
        ))}
      </div>
      <div className="pt-2 text-[11px] leading-relaxed text-[var(--ds-text-secondary)]">Do not dose automatically. Follow the product label.</div>
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
      onClick={handleClick}
      disabled={!entityId || loading}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 min-h-[72px] transition-all disabled:opacity-40"
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

function SpaControlsCard() {
  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: 16 }}>
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

function QuickActionsCard() {
  const { state: standbyTemp } = useEntity(SPA_ENTITIES.standbyTemp);
  const { callService } = useServiceCall();

  const setReady = async () => {
    await callService('climate', 'set_temperature', { entity_id: SPA_ENTITIES.climate, temperature: SPA_TARGET_PRESETS.ready });
    await callService('select', 'select_option', { entity_id: SPA_ENTITIES.status, option: 'READY' });
  };

  const setEco = async () => {
    if (standbyTemp != null && Number.isFinite(Number.parseFloat(standbyTemp))) {
      await callService('climate', 'set_temperature', {
        entity_id: SPA_ENTITIES.climate,
        temperature: Number.parseFloat(standbyTemp),
      });
    }
    await callService('select', 'select_option', { entity_id: SPA_ENTITIES.status, option: 'REST' });
  };

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: 16 }}>
      <h3 className="text-base font-bold text-[var(--ds-text)] pb-3 border-b border-[var(--ds-border)]">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2.5 pt-3">
        <button onClick={setReady} className="rounded-xl px-3 py-3 text-sm font-semibold transition-all" style={{ backgroundColor: 'var(--ds-state-on-bg)', color: 'var(--ds-state-on)' }}>
          Ready
        </button>
        <button onClick={setEco} className="rounded-xl px-3 py-3 text-sm font-semibold transition-all" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-text)' }}>
          Eco
        </button>
      </div>
      <div className="mt-3 text-xs leading-relaxed text-[var(--ds-text-secondary)]">
        Ready sets the spa to 38°C. Eco uses the configured standby temperature and REST mode without disabling safety functions.
      </div>
    </div>
  );
}

function OutdoorLightsCard() {
  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: 16 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Outdoor Lights</h3>
        <Trees size={18} className="text-[var(--ds-text-secondary)]" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3 flex-1">
        <ControlButton icon={Trees} label="Games Room" entityId={SPA_ENTITIES.outdoorGamesRoom} />
        <button disabled className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl p-3 opacity-55" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-warm-inactive-text)' }} title="No Gazebo light entity is exposed by Home Assistant">
          <SunMedium size={24} />
          <span className="text-sm font-semibold">Gazebo</span>
          <span className="text-[10px]">Not connected</span>
        </button>
      </div>
    </div>
  );
}

function SonosCard() {
  const { state, attributes } = useEntity(SPA_ENTITIES.sonos);
  const { callService } = useServiceCall();
  const isPlaying = state === 'playing';

  const artwork = attributes?.entity_picture;
  const title = attributes?.media_title || 'No track';
  const artist = attributes?.media_artist || 'Sonos Port';
  const volume = attributes?.volume_level != null ? Math.round(attributes.volume_level * 100) : null;

  const handleToggle = () => {
    if (!SPA_ENTITIES.sonos) return;
    return callService('media_player', isPlaying ? 'media_pause' : 'media_play', { entity_id: SPA_ENTITIES.sonos });
  };

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden" style={{ padding: 16 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Sonos</h3>
        <Volume2 size={18} className="text-[var(--ds-text-secondary)]" />
      </div>
      <div className="flex gap-3 pt-3 min-h-0">
        <div className="w-[88px] h-[88px] rounded-xl overflow-hidden bg-[var(--ds-warm-inactive-bg)] flex-shrink-0">
          {artwork ? <img src={artwork} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Bath size={28} className="text-[var(--ds-text-secondary)]" /></div>}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="text-base font-semibold truncate text-[var(--ds-text)]">{title}</div>
            <div className="text-sm truncate text-[var(--ds-text-secondary)]">{artist}</div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={handleToggle} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold" style={{ backgroundColor: 'var(--ds-state-on-bg)', color: 'var(--ds-state-on)' }}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            {volume != null && <StatusChip label={`${volume}%`} tone="info" active />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsCard() {
  const alert = useEntity(SPA_ENTITIES.alert);
  const fault = useEntity(SPA_ENTITIES.fault);
  const online = useEntity(SPA_ENTITIES.online);
  const alertCount = Number.parseInt(alert.state, 10);
  const hasFault = fault.state && !['unknown', 'unavailable', 'none', ''].includes(String(fault.state).toLowerCase());
  const hasAlert = (Number.isFinite(alertCount) && alertCount > 0) || hasFault || online.state === 'off';
  if (!hasAlert) return null;
  return (
    <div className="ds-card flex items-center gap-3" style={{ padding: 14, backgroundColor: 'rgba(196,99,106,0.08)', borderColor: 'rgba(196,99,106,0.22)' }}>
      <ShieldAlert size={20} className="text-[var(--ds-health-bad)] flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-bold text-[var(--ds-text)]">Spa needs attention</div>
        <div className="text-xs text-[var(--ds-text-secondary)]">Check water chemistry, temperature, or the spa controller.</div>
      </div>
    </div>
  );
}

export function SpaDashboard() {
  const sonosState = useEntity(SPA_ENTITIES.sonos).state;
  const hasSonos = sonosState != null && !['unknown', 'unavailable'].includes(String(sonosState));
  const rightPanels = useMemo(() => [
    { key: 'controls', node: <SpaControlsCard /> },
    { key: 'actions', node: <QuickActionsCard /> },
    { key: 'outdoor', node: <OutdoorLightsCard /> },
    { key: 'sonos', node: hasSonos ? <SonosCard /> : null },
  ].filter((item) => item.node), [hasSonos]);

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-72px)] gap-2 p-2 overflow-y-auto md:overflow-hidden">
      <div className="md:flex-[58] min-w-0 grid min-h-0 grid-rows-[minmax(190px,0.85fr)_minmax(205px,0.85fr)_minmax(260px,1.3fr)] gap-2 overflow-hidden">
        <div className="min-h-0">
          <LargeTempCard />
        </div>
        <div className="grid min-h-0 grid-cols-1 gap-2 md:grid-cols-2">
          <WaterQualityCard />
          <div className="flex min-h-0 flex-col gap-2">
            <IcoActionCard />
            <AlertsCard />
          </div>
        </div>
        <div className="min-h-0"><SpaHistoryCharts /></div>
      </div>

      <div className="md:flex-[42] min-w-0 flex flex-col gap-2 overflow-hidden">
        {rightPanels.map((panel) => (
          <div key={panel.key} className="flex-1 min-h-0">
            {panel.node}
          </div>
        ))}
      </div>
    </div>
  );
}
