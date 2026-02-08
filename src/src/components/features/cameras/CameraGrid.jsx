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
            // Normal mode: Front door left 50%, Front R+L stacked right 50%, Back 5 bottom
            gridTemplateColumns: 'repeat(10, 1fr)', // 10 columns for flexibility
            gridTemplateRows: '32.5fr 32.5fr 35fr', // Top half split, then bottom
          })
        }}
      >
        {alertMode ? (
          // Alert mode: front door large (70%), other 2 stacked on right
          <>
            {/* Front door - large, left side, full height */}
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
          // Normal mode: Front door left 50%, Front R+L stacked right 50%, Back 5 bottom
          <>
            {/* Front door - left 50% width (columns 1-5), top 65% height (rows 1-2) */}
            <div style={{ gridColumn: '1 / 6', gridRow: '1 / 3' }}>
              <CameraFeed
                camera={frontCameras[0]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[0])}
                className="h-full"
              />
            </div>

            {/* Front right - right 50% width (columns 6-10), top half */}
            <div style={{ gridColumn: '6 / 11', gridRow: 1 }}>
              <CameraFeed
                camera={frontCameras[1]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[1])}
                className="h-full"
              />
            </div>

            {/* Front left - right 50% width (columns 6-10), bottom half */}
            <div style={{ gridColumn: '6 / 11', gridRow: 2 }}>
              <CameraFeed
                camera={frontCameras[2]}
                stream={true}
                onClick={() => setSelectedCamera(frontCameras[2])}
                className="h-full"
              />
            </div>

            {/* Back 5 cameras - bottom row, each takes 2 columns */}
            {otherCameras.map((camera, idx) => (
              <div key={camera.id} style={{ gridColumn: `${idx * 2 + 1} / ${idx * 2 + 3}`, gridRow: 3 }}>
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
