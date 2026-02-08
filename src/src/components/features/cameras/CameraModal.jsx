import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useMjpegStream } from './hooks/useMjpegStream';

export function CameraModal({ camera, onClose }) {
  const { url } = useMjpegStream(camera.id);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Camera label - top left */}
        <div className="absolute top-8 left-8 bg-black/70 px-4 py-2 rounded-lg text-white text-xl font-semibold z-10">
          {camera.label}
        </div>

        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-black/70 rounded-lg hover:bg-black/90 transition-colors z-10"
          aria-label="Close modal"
        >
          <X size={32} className="text-white" />
        </button>

        {/* Camera stream */}
        {url ? (
          <img
            src={url}
            alt={camera.label}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-white text-center">
            <div className="text-xl mb-2">Loading camera stream...</div>
            <div className="text-gray-400">{camera.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}
