import { useState, useEffect, useCallback } from 'react';
import { useEntity } from '../../../../hooks/useEntity';
import { getHAConfig } from '../../../../utils/ha-config';

export function useCameraSnapshot(entityId, intervalMs = 3000, enabled = true) {
  const { attributes } = useEntity(entityId);
  const [url, setUrl] = useState('');

  const refresh = useCallback(() => {
    if (!attributes?.access_token) return;
    const { url: baseUrl } = getHAConfig({ useProxy: true });
    setUrl(`${baseUrl}/api/camera_proxy/${entityId}?token=${attributes.access_token}&t=${Date.now()}`);
  }, [entityId, attributes?.access_token]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs, enabled]);

  return { url, refresh };
}
