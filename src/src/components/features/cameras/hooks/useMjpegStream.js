import { useMemo } from 'react';
import { useEntity } from '../../../../hooks/useEntity';
import { getHAConfig } from '../../../../utils/ha-config';

export function useMjpegStream(entityId) {
  const { attributes } = useEntity(entityId);

  const url = useMemo(() => {
    if (!attributes?.access_token) return '';
    const { url: baseUrl } = getHAConfig({ useProxy: true });
    // Use relative path when baseUrl is empty to stay within ingress context
    const apiPath = baseUrl ? `${baseUrl}/api` : 'api';
    return `${apiPath}/camera_proxy_stream/${entityId}?token=${attributes.access_token}`;
  }, [entityId, attributes?.access_token]);

  return { url };
}
