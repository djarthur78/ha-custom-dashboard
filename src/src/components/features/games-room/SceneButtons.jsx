/**
 * SceneButtons Component
 * Four scene buttons in a 2x2 grid, then full-width PS5 and All Off.
 */

import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { useSofaBatonActivity } from './hooks/useSofaBatonActivity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { useEntity } from '../../../hooks/useEntity';
import {
  GAMES_ROOM_ACTIVITY_LIGHTS,
  GAMES_ROOM_COMMON_POWER,
  SOFABATON_ACTIVITY_ENTITY,
  SCENES,
  SUN_ENTITY,
} from './gamesRoomConfig';
import { GARDEN_LIGHT_ENTITIES } from '../garden-lights/gardenLightsConfig';

function isDuskOrDark(sunState, sunAttributes) {
  if (sunState === 'below_horizon') return true;
  const elevation = Number(sunAttributes?.elevation);
  return Number.isFinite(elevation) && elevation <= 3;
}

function SceneButton({ scene, fullWidth = false, active, loading, onSceneClick }) {
  const Icon = LucideIcons[scene.icon];

  return (
    <button
      onClick={() => onSceneClick(scene)}
      disabled={loading}
      aria-pressed={active}
      title="Selection reported by SofaBaton; equipment readiness is not verified"
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3
                 font-bold transition-all min-h-[60px] ${fullWidth ? 'w-full' : ''}
                 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={
        active
          ? {
              backgroundColor: scene.id === 'ps5' ? scene.color : 'var(--ds-accent)',
              color: 'white',
            }
          : {
              backgroundColor: scene.id === 'ps5' ? scene.bgColor : 'var(--ds-warm-inactive-bg)',
              color: scene.id === 'ps5' ? scene.color : 'var(--ds-warm-inactive-text)',
            }
      }
    >
      {Icon && <Icon size={24} />}
      <span className="text-sm">{scene.label}</span>
    </button>
  );
}

export function SceneButtons() {
  const { callService, loading } = useServiceCall();
  const { currentActivity, options, available } = useSofaBatonActivity();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const sun = useEntity(SUN_ENTITY);

  const handleSceneClick = async (scene) => {
    if (pending || loading || (scene.activity && (!available || !options.includes(scene.activity)))) return;
    setPending(true);
    setError(null);
    try {
      if (scene.action) {
        await callService(scene.action.domain, scene.action.service, scene.action.data);
        return;
      }

      if (scene.activity) {
        const turnOnEntities = [
          ...GAMES_ROOM_COMMON_POWER,
          ...GAMES_ROOM_ACTIVITY_LIGHTS,
        ];

        if (isDuskOrDark(sun.state, sun.attributes)) {
          turnOnEntities.push(...GARDEN_LIGHT_ENTITIES);
        }

        await callService('homeassistant', 'turn_on', { entity_id: turnOnEntities });
        await callService('select', 'select_option', {
          entity_id: SOFABATON_ACTIVITY_ENTITY,
          option: scene.activity,
        });
        return;
      }
    } catch (err) {
      setError(err.message || 'Unable to change scene');
    } finally {
      setPending(false);
    }
  };

  const mainScenes = SCENES.slice(0, 4);  // Movie, Sky TV, Netflix, Sonos
  const ps5 = SCENES[4];                 // PS5
  const allOff = SCENES[5];              // All Off

  const isActive = (scene) => {
    return available && scene.activeWhen.includes(currentActivity);
  };

  return (
    <div
      className="ds-card h-full flex flex-col gap-2"
    >
      {/* 2x2 Grid for first 4 scenes */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {mainScenes.map((scene) => (
          <SceneButton
            key={scene.id}
            scene={scene}
            active={isActive(scene)}
            loading={loading || pending || !available || !options.includes(scene.activity)}
            onSceneClick={handleSceneClick}
          />
        ))}
      </div>

      <SceneButton
        scene={ps5}
        fullWidth
        active={isActive(ps5)}
        loading={loading || pending || !available || !options.includes(ps5.activity)}
        onSceneClick={handleSceneClick}
      />

      {/* Full-width All Off button */}
      <SceneButton
        scene={allOff}
        fullWidth
        active={isActive(allOff)}
        loading={loading || pending}
        onSceneClick={handleSceneClick}
      />
      {(error || !available) && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error || 'SofaBaton activity selector unavailable.'}
        </p>
      )}
    </div>
  );
}
