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
        className={`flex flex-col items-center justify-center gap-2 rounded-lg p-4
                   font-bold transition-all min-h-[80px] ${fullWidth ? 'w-full' : ''}
                   hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        style={
          active
            ? {
                backgroundColor: scene.color,
                color: 'white',
                boxShadow: `0 0 20px ${scene.color}40`,
              }
            : {
                backgroundColor: scene.bgColor,
                color: scene.color,
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
      className="bg-[var(--color-surface)] rounded-xl h-full p-4 flex flex-col gap-2"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
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
