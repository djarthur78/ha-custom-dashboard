import { useState } from 'react';
import { CameraFeed } from './CameraFeed';
import { CameraModal } from './CameraModal';
import { CAMERAS } from './camerasConfig';

export function CameraGrid({ alertMode = false, onDismissAlert }) {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [activeTab, setActiveTab] = useState('front');

  // Split cameras by zone
  const frontCameras = CAMERAS.filter(c => c.zone === 'front');
  const otherCameras = CAMERAS.filter(c => c.zone === 'other');

  const tabBarHeight = 44;

  return (
    <>
      {/* Tab Bar */}
      <div className="flex" style={{ height: tabBarHeight, backgroundColor: 'var(--ds-card)', borderBottom: '1px solid var(--ds-border)' }}>
        <button
          onClick={() => setActiveTab('front')}
          className="flex-1 text-sm font-semibold transition-colors"
          style={activeTab === 'front'
            ? { color: 'var(--ds-accent)', borderBottom: '2px solid var(--ds-accent)' }
            : { color: 'var(--ds-text-secondary)' }
          }
        >
          Front Cameras
        </button>
        <button
          onClick={() => setActiveTab('outbuildings')}
          className="flex-1 text-sm font-semibold transition-colors"
          style={activeTab === 'outbuildings'
            ? { color: 'var(--ds-accent)', borderBottom: '2px solid var(--ds-accent)' }
            : { color: 'var(--ds-text-secondary)' }
          }
        >
          Outbuildings
        </button>
      </div>

      {/* Front Cameras Tab */}
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
              stream={true}
              onClick={() => setSelectedCamera(frontCameras[0])}
              className="h-full"
            />
          </div>

          {/* Front Right — top right */}
          <div style={{ gridColumn: 2, gridRow: 1, minHeight: 0, minWidth: 0 }}>
            <CameraFeed
              camera={frontCameras[1]}
              stream={true}
              onClick={() => setSelectedCamera(frontCameras[1])}
              className="h-full"
            />
          </div>

          {/* Front Left — bottom right */}
          <div style={{ gridColumn: 2, gridRow: 2, minHeight: 0, minWidth: 0 }}>
            <CameraFeed
              camera={frontCameras[2]}
              stream={true}
              onClick={() => setSelectedCamera(frontCameras[2])}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Outbuildings Tab */}
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
            gridTemplateColumns: `repeat(${Math.min(otherCameras.length, 3)}, 1fr)`,
            gridTemplateRows: otherCameras.length > 3 ? '1fr 1fr' : '1fr',
          }}
        >
          {otherCameras.map((camera) => (
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
