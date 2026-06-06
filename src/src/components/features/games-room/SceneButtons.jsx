/**
 * SceneButtons Component
 * 5 scene mode buttons (2x2 grid + full-width All Off).
 */

import * as LucideIcons from 'lucide-react';
import { useHarmonyActivity } from './hooks/useHarmonyActivity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { useEntity } from '../../../hooks/useEntity';
import {
  GAMES_ROOM_ACTIVITY_LIGHTS,
  GAMES_ROOM_COMMON_POWER,
  GAMES_ROOM_OUTDOOR_LIGHT,
  HARMONY_REMOTE_ENTITY,
  SCENES,
  SUN_ENTITY,
} from './gamesRoomConfig';

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
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3
                 font-bold transition-all min-h-[60px] ${fullWidth ? 'w-full' : ''}
                 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={
        active
          ? {
              backgroundColor: 'var(--ds-accent)',
              color: 'white',
            }
          : {
              backgroundColor: 'var(--ds-warm-inactive-bg)',
              color: 'var(--ds-warm-inactive-text)',
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
  const { currentActivity } = useHarmonyActivity();
  const sun = useEntity(SUN_ENTITY);

  const handleSceneClick = async (scene) => {
    if (scene.harmonyActivity) {
      const turnOnEntities = [
        ...GAMES_ROOM_COMMON_POWER,
        ...GAMES_ROOM_ACTIVITY_LIGHTS,
      ];

      if (isDuskOrDark(sun.state, sun.attributes)) {
        turnOnEntities.push(GAMES_ROOM_OUTDOOR_LIGHT);
      }

      await callService('switch', 'turn_on', { entity_id: turnOnEntities });
      await callService('remote', 'turn_on', {
        entity_id: HARMONY_REMOTE_ENTITY,
        activity: scene.harmonyActivity,
      });
      return;
    }

    await callService(scene.action.domain, scene.action.service, scene.action.data);
  };

  const mainScenes = SCENES.slice(0, 4);  // Movie, Sky TV, Netflix, Sonos
  const allOff = SCENES[4];               // All Off

  const isActive = (scene) => {
    return scene.activeWhen.includes(currentActivity);
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
            loading={loading}
            onSceneClick={handleSceneClick}
          />
        ))}
      </div>

      {/* Full-width All Off button */}
      <SceneButton
        scene={allOff}
        fullWidth
        active={isActive(allOff)}
        loading={loading}
        onSceneClick={handleSceneClick}
      />
    </div>
  );
}
