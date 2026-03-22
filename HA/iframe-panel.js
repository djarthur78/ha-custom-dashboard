class IframePanel extends HTMLElement {
  set hass(hass) { this._hass = hass; this._render(); }
  set panel(panel) { this._config = panel.config; this._render(); }
  async _render() {
    if (!this._config || !this._hass) return;
    const isHttps = window.location.protocol === "https:";

    // On HTTPS, we must resolve the ingress URL before rendering anything
    if (isHttps) {
      // Already resolved or failed — use what we have
      if (this._ingressResolved) {
        if (!this._ingressUrl) {
          // Ingress lookup failed — show error instead of HTTP iframe
          if (!this._errorShown) {
            this._errorShown = true;
            this.innerHTML = '<div style="padding:20px;color:#c00;font-family:sans-serif;">' +
              'Unable to load dashboard through HTTPS. Please check addon ingress configuration.</div>';
          }
          return;
        }
      } else {
        // Not yet resolved — start lookup if not already running
        if (this._ingressLookupRunning) return;
        this._ingressLookupRunning = true;
        try {
          const info = await this._hass.callWS({ type: "supervisor/api", endpoint: "/addons/c2ba14e6_family-dashboard/info", method: "get" });
          if (info.ingress_entry) {
            const sess = await this._hass.callWS({ type: "supervisor/api", endpoint: "/ingress/session", method: "post" });
            if (sess && sess.session) {
              document.cookie = "ingress_session=" + sess.session + ";path=/api/hassio_ingress/;SameSite=Strict";
            }
            this._ingressUrl = info.ingress_entry + "/mobile/";
          }
        } catch(e) {
          console.warn("[iframe-panel] Ingress lookup failed:", e);
        }
        this._ingressResolved = true;
        this._ingressLookupRunning = false;
        // Re-render now that we have the result
        this._render();
        return;
      }
    }

    const url = isHttps ? this._ingressUrl : this._config.url;
    if (this._url === url) return;
    this._url = url;
    this.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.cssText = "border:0;width:100%;height:100%;";
    iframe.allow = "fullscreen";
    this.style.cssText = "display:block;width:100%;height:100%;";
    this.appendChild(iframe);
  }
}
customElements.define("arthur-mobile", IframePanel);
