import { useCameraSnapshot } from './hooks/useCameraSnapshot';
import { useMjpegStream } from './hooks/useMjpegStream';

export function CameraFeed({ camera, stream = false, onClick, className = '' }) {
  const { url: streamUrl } = useMjpegStream(camera.id);
  const { url: snapshotUrl } = useCameraSnapshot(camera.id, 3000);

  const imageUrl = stream ? streamUrl : snapshotUrl;
  const isLoading = !imageUrl;

  return (
    <div
      className={`relative overflow-hidden bg-gray-900 cursor-pointer group ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      style={{ minHeight: 0, minWidth: 0, maxHeight: '100%', maxWidth: '100%' }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-sm mb-2">Loading...</div>
            <div className="text-xs text-gray-500">{camera.label}</div>
          </div>
        </div>
      ) : (
        <>
          <img
            src={imageUrl}
            alt={camera.label}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading={stream ? undefined : 'lazy'}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Error fallback */}
          <div className="hidden absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-800">
            <div className="text-center">
              <div className="text-sm mb-1">{camera.label}</div>
              <div className="text-xs text-red-400">Offline</div>
            </div>
          </div>
        </>
      )}

      {/* Camera label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-white text-sm font-medium">
        {camera.label}
      </div>
    </div>
  );
}
