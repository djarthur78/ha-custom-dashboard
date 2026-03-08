/**
 * MobileCamerasPage
 * Single-column camera feeds with tab bar
 */

import { useState } from 'react';
import { MobileTabSwitcher } from '../../components/mobile/MobileTabSwitcher';
import { CameraFeed } from '../../components/features/cameras/CameraFeed';
import { CameraModal } from '../../components/features/cameras/CameraModal';
import { CAMERAS } from '../../components/features/cameras/camerasConfig';

const tabs = [
  { id: 'front', label: 'Front' },
  { id: 'outside', label: 'Outside' },
  { id: 'outbuildings', label: 'Outbuildings' },
];

export function MobileCamerasPage() {
  const [activeTab, setActiveTab] = useState('front');
  const [selectedCamera, setSelectedCamera] = useState(null);

  const cameras = CAMERAS.filter(c => c.zone === activeTab);

  return (
    <div>
      <MobileTabSwitcher tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="p-2 space-y-2">
        {cameras.map((camera) => (
          <div
            key={camera.id}
            className="rounded-xl overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            <CameraFeed
              camera={camera}
              stream={false}
              onClick={() => setSelectedCamera(camera)}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {selectedCamera && (
        <CameraModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
}

export default MobileCamerasPage;
