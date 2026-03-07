/**
 * SceneButtons Component
 * 5 scene mode buttons (2x2 grid + full-width All Off).
 */

import * as LucideIcons from 'lucide-react';
import { useHarmonyActivity } from './hooks/useHarmonyActivity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { SCENES } from './gamesRoomConfig';

export function SceneButtons() {
  const { callService, loading } = useServiceCall();
  const { currentActivity } = useHarmonyActivity();

  const handleSceneClick = async (scene) => {
    await callService(scene.action.domain, scene.action.service, scene.action.data);
  };

  const mainScenes = SCENES.slice(0, 4);  // Movie, Sky TV, Netflix, Sonos
  const allOff = SCENES[4];               // All Off

  const isActive = (scene) => {
    return scene.activeWhen.includes(currentActivity);
  };

  const SceneButton = ({ scene, fullWidth = false }) => {
    const Icon = LucideIcons[scene.icon];
    const active = isActive(scene);

    return (
      <button
        onClick={() => handleSceneClick(scene)}
        disabled={loading}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4
                   font-bold transition-all min-h-[80px] ${fullWidth ? 'w-full' : ''}
                   hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        style={
          active
            ? {
                backgroundColor: '#9f5644',
                color: 'white',
              }
            : {
                backgroundColor: '#e8e4e1',
                color: '#8a8380',
              }
        }
      >
        {Icon && <Icon size={28} />}
        <span className="text-sm">{scene.label}</span>
      </button>
    );
  };

  return (
    <div
      className="ds-card h-full flex flex-col gap-2"
    >
      {/* 2x2 Grid for first 4 scenes */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {mainScenes.map((scene) => (
          <SceneButton key={scene.id} scene={scene} />
        ))}
      </div>

      {/* Full-width All Off button */}
      <SceneButton scene={allOff} fullWidth />
    </div>
  );
}
