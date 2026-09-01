(function configureHomeAssistantBoundary() {
  const ingress = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/);
  const apiBase = ingress ? `${ingress[0]}/ha-read` : '/ha-read';

  window.HA_CONFIG = Object.freeze({ apiBase, readOnly: true });
}());
