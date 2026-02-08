import { useState } from 'react';
import { CameraFeed } from './CameraFeed';
import { CameraModal } from './CameraModal';
import { DoorbellBanner } from './DoorbellBanner';
import { CAMERAS } from './camerasConfig';

export function CameraGrid({ alertMode = false, onDismissAlert }) {
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Split cameras by zone
  const frontCameras = CAMERAS.filter(c => c.zone === 'front');
  const otherCameras = CAMERAS.filter(c => c.zone === 'other');

  return (
    <>
      {/* Alert banner */}
      {alertMode && <DoorbellBanner onDismiss={onDismissAlert} />}

      {/* Camera grid */}
      <div
        className={`camera-grid ${alertMode ? 'camera-grid-alert doorbell-border doorbell-flash' : ''}`}
        style={{
          display: 'grid',
          gap: '4px',
          height: 'calc(100vh - 56px)',
          ...(alertMode ? {
            // Alert mode: front door large (70%), other 2 front on right (30%)
            gridTemplateColumns: '70fr 30fr',
            gridTemplateRows: '1fr 1fr',
          } : {
            // Normal mode: 3 front top (65%), 5 other bottom (35%)
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: '65fr 35fr',
          })
        }}
      >
        {alertMode ? (
          // Alert mode: only show 3 front cameras
          <>
            {/* Front door - large, left side */}
            <div style={{ gridColumn: 1, gridRow: '1 / 3' }}>
              <CameraFeed
                camera={frontCameras[0]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[0])}
                className="h-full"
              />
            </div>

            {/* Front right - top right */}
            <div style={{ gridColumn: 2, gridRow: 1 }}>
              <CameraFeed
                camera={frontCameras[1]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[1])}
                className="h-full"
              />
            </div>

            {/* Front left - bottom right */}
            <div style={{ gridColumn: 2, gridRow: 2 }}>
              <CameraFeed
                camera={frontCameras[2]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[2])}
                className="h-full"
              />
            </div>
          </>
        ) : (
          // Normal mode: all 8 cameras
          <>
            {/* Front cameras - top row (span multiple columns for width) */}
            <div style={{ gridColumn: '1 / 3', gridRow: 1 }}>
              <CameraFeed
                camera={frontCameras[0]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[0])}
                className="h-full"
              />
            </div>

            <div style={{ gridColumn: 3, gridRow: 1 }}>
              <CameraFeed
                camera={frontCameras[1]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[1])}
                className="h-full"
              />
            </div>

            <div style={{ gridColumn: '4 / 6', gridRow: 1 }}>
              <CameraFeed
                camera={frontCameras[2]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[2])}
                className="h-full"
              />
            </div>

            {/* Other cameras - bottom row (1 column each) */}
            {otherCameras.map((camera, idx) => (
              <div key={camera.id} style={{ gridColumn: idx + 1, gridRow: 2 }}>
                <CameraFeed
                  camera={camera}
                  stream={false}
                  onClick={() => setSelectedCamera(camera)}
                  className="h-full"
                />
              </div>
            ))}
          </>
        )}
      </div>

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
