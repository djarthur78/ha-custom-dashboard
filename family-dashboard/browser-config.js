(function configureHomeAssistantBoundary() {
  const ingress = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/);
  const ingressBase = ingress ? ingress[0] : '';

  window.HA_CONFIG = Object.freeze({
    apiBase: `${ingressBase}/ha-read`,
    controlApiBase: `${ingressBase}/ha-control`,
    readOnly: false,
  });
}());
