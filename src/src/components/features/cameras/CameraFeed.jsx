import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { useCameraSnapshot } from './hooks/useCameraSnapshot';
import { useMjpegStream } from './hooks/useMjpegStream';

function LoadingSkeleton({ label }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
      <div className="text-center">
        <Camera size={32} className="text-gray-500 mx-auto mb-2" />
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function ErrorState({ label, onRetry }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
      <div className="text-center">
        <Camera size={32} className="text-gray-600 mx-auto mb-2" />
        <div className="text-sm text-gray-400 mb-1">{label}</div>
        <div className="text-xs text-red-400 mb-2">Offline</div>
        {onRetry && (
          <button
            onClick={(e) => { e.stopPropagation(); onRetry(); }}
            className="flex items-center gap-1 mx-auto px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

function CameraShell({ camera, imageUrl, isLoading, hasError, onRetry, onClick, className }) {
  const [imgError, setImgError] = useState(false);

  // Reset img error when URL changes
  useEffect(() => {
    if (imageUrl) setImgError(false);
  }, [imageUrl]);

  const showError = hasError || imgError;
  const showLoading = isLoading && !showError;

  return (
    <div
      className={`relative overflow-hidden bg-gray-900 cursor-pointer group ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      style={{ minHeight: 0, minWidth: 0, maxHeight: '100%', maxWidth: '100%' }}
    >
      {showLoading && <LoadingSkeleton label={camera.label} />}
      {showError && <ErrorState label={camera.label} onRetry={onRetry} />}

      {!showError && imageUrl && (
        <img
          src={imageUrl}
          alt={camera.label}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-white text-sm font-medium">
        {camera.label}
      </div>
    </div>
  );
}

function SnapshotFeed({ camera, onClick, className }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const interval = camera.interval || 10000;
  const { url, refresh, hasToken, error } = useCameraSnapshot(camera.id, interval, isVisible);

  return (
    <div ref={ref} className="h-full">
      <CameraShell
        camera={camera}
        imageUrl={url}
        isLoading={!url && !error && isVisible}
        hasError={!!error || (isVisible && !hasToken)}
        onRetry={refresh}
        onClick={onClick}
        className={className}
      />
    </div>
  );
}

function StreamFeed({ camera, onClick, className }) {
  const { url, hasToken, error } = useMjpegStream(camera.id);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryCount(c => c + 1);
  }, []);

  return (
    <CameraShell
      key={retryCount}
      camera={camera}
      imageUrl={url}
      isLoading={!url && !error}
      hasError={!!error || !hasToken}
      onRetry={handleRetry}
      onClick={onClick}
      className={className}
    />
  );
}

export function CameraFeed({ camera, stream = false, onClick, className = '' }) {
  if (stream) {
    return <StreamFeed camera={camera} onClick={onClick} className={className} />;
  }
  return <SnapshotFeed camera={camera} onClick={onClick} className={className} />;
}
