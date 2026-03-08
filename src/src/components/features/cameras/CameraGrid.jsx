import { useState } from 'react';
import { CameraFeed } from './CameraFeed';
import { CameraModal } from './CameraModal';
import { CAMERAS } from './camerasConfig';

export function CameraGrid({ alertMode = false, onDismissAlert }) {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [activeTab, setActiveTab] = useState('front');

  // Split cameras by zone
  const frontCameras = CAMERAS.filter(c => c.zone === 'front');
  const outsideCameras = CAMERAS.filter(c => c.zone === 'outside');
  const outbuildingsCameras = CAMERAS.filter(c => c.zone === 'outbuildings');

  const tabs = [
    { id: 'front', label: 'Front' },
    { id: 'outside', label: 'Outside' },
    { id: 'outbuildings', label: 'Outbuildings' },
  ];

  const tabBarHeight = 44;

  return (
    <>
      {/* Tab Bar */}
      <div className="flex" style={{ height: tabBarHeight, backgroundColor: 'var(--ds-card)', borderBottom: '1px solid var(--ds-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 text-sm font-semibold transition-colors"
            style={activeTab === tab.id
              ? { color: 'var(--ds-accent)', borderBottom: '2px solid var(--ds-accent)' }
              : { color: 'var(--ds-text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Front Cameras Tab — 3fr 2fr grid, snapshot polling at 2s */}
      {activeTab === 'front' && (
        <div
          className="camera-grid"
          style={{
            display: 'grid',
            gap: '4px',
            height: `calc(100vh - 72px - ${tabBarHeight}px)`,
            maxHeight: `calc(100vh - 72px - ${tabBarHeight}px)`,
            minHeight: 0,
            overflow: 'hidden',
            gridTemplateColumns: '3fr 2fr',
            gridTemplateRows: '1fr 1fr',
          }}
        >
          {/* Front Door — full height left */}
          <div style={{ gridColumn: 1, gridRow: '1 / 3', minHeight: 0, minWidth: 0 }}>
            <CameraFeed
              camera={frontCameras[0]}
              stream={false}
              onClick={() => setSelectedCamera(frontCameras[0])}
              className="h-full"
            />
          </div>

          {/* Front Right — top right */}
          <div style={{ gridColumn: 2, gridRow: 1, minHeight: 0, minWidth: 0 }}>
            <CameraFeed
              camera={frontCameras[1]}
              stream={false}
              onClick={() => setSelectedCamera(frontCameras[1])}
              className="h-full"
            />
          </div>

          {/* Front Left — bottom right */}
          <div style={{ gridColumn: 2, gridRow: 2, minHeight: 0, minWidth: 0 }}>
            <CameraFeed
              camera={frontCameras[2]}
              stream={false}
              onClick={() => setSelectedCamera(frontCameras[2])}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Outside Tab — 4 cameras in 2x2 grid */}
      {activeTab === 'outside' && (
        <div
          className="camera-grid"
          style={{
            display: 'grid',
            gap: '4px',
            height: `calc(100vh - 72px - ${tabBarHeight}px)`,
            maxHeight: `calc(100vh - 72px - ${tabBarHeight}px)`,
            minHeight: 0,
            overflow: 'hidden',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
          }}
        >
          {outsideCameras.map((camera) => (
            <div key={camera.id} style={{ minHeight: 0, minWidth: 0 }}>
              <CameraFeed
                camera={camera}
                stream={false}
                onClick={() => setSelectedCamera(camera)}
                className="h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* Outbuildings Tab — 2 cameras stacked vertically */}
      {activeTab === 'outbuildings' && (
        <div
          className="camera-grid"
          style={{
            display: 'grid',
            gap: '4px',
            height: `calc(100vh - 72px - ${tabBarHeight}px)`,
            maxHeight: `calc(100vh - 72px - ${tabBarHeight}px)`,
            minHeight: 0,
            overflow: 'hidden',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr 1fr',
          }}
        >
          {outbuildingsCameras.map((camera) => (
            <div key={camera.id} style={{ minHeight: 0, minWidth: 0 }}>
              <CameraFeed
                camera={camera}
                stream={false}
                onClick={() => setSelectedCamera(camera)}
                className="h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal for enlarged view */}
      {selectedCamera && (
        <CameraModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </>
  );
}
