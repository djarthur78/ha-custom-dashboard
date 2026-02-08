import { useState, useEffect, useCallback } from 'react';
import { useEntity } from '../../../../hooks/useEntity';
import { getHAConfig } from '../../../../utils/ha-config';

export function useCameraSnapshot(entityId, intervalMs = 3000) {
  const { attributes } = useEntity(entityId);
  const [url, setUrl] = useState('');

  const refresh = useCallback(() => {
    if (!attributes?.access_token) return;
    const { url: baseUrl } = getHAConfig({ useProxy: true });
    // Use relative path when baseUrl is empty to stay within ingress context
    const apiPath = baseUrl ? `${baseUrl}/api` : 'api';
    setUrl(`${apiPath}/camera_proxy/${entityId}?token=${attributes.access_token}&t=${Date.now()}`);
  }, [entityId, attributes?.access_token]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { url, refresh };
}
