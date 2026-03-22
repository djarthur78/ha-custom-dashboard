class IframePanel extends HTMLElement {
  set hass(hass) { this._hass = hass; this._render(); }
  set panel(panel) { this._config = panel.config; this._render(); }
  async _render() {
    if (!this._config || !this._hass) return;
    let url = this._config.url;
    if (window.location.protocol === "https:" && !this._ingressUrl) {
      try {
        // Step 1: Get the addon's ingress entry path
        const info = await this._hass.callWS({ type: "supervisor/api", endpoint: "/addons/c2ba14e6_family-dashboard/info", method: "get" });
        if (info.ingress_entry) {
          // Step 2: Create an ingress session (required for the iframe to authenticate)
          // This mirrors what HA's own frontend does for addon panels
          const sess = await this._hass.callWS({ type: "supervisor/api", endpoint: "/ingress/session", method: "post" });
          if (sess && sess.session) {
            document.cookie = "ingress_session=" + sess.session + ";path=/api/hassio_ingress/;SameSite=Strict";
          }
          this._ingressUrl = info.ingress_entry + "/mobile/";
        }
      } catch(e) { console.warn("[iframe-panel] Ingress lookup failed:", e); }
    }
    if (this._ingressUrl && window.location.protocol === "https:") url = this._ingressUrl;
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
