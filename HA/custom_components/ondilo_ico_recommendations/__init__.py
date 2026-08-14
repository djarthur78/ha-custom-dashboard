"""Expose the active Ondilo ICO recommendations in Home Assistant."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval

DOMAIN = "ondilo_ico_recommendations"
API_BASE = "https://interop.ondilo.com/api/customer/v1"
POLL_INTERVAL = timedelta(minutes=15)
_LOGGER = logging.getLogger(__name__)


def _items(payload: Any) -> list[dict[str, Any]]:
    """Return list data from the API's common envelope shapes."""
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("recommendations", "data", "items", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def _normalise_recommendation(item: dict[str, Any]) -> dict[str, Any]:
    """Keep useful recommendation content and omit account data."""
    title = item.get("title") or item.get("name") or "ICO recommendation"
    message = item.get("message") or item.get("description") or item.get("details") or ""
    return {
        "id": item.get("id"),
        "title": str(title),
        "action": str(title),
        "message": str(message),
    }


class RecommendationBridge:
    """Poll ICO recommendations using the native integration's OAuth session."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.remove_interval = None
        self.session = None
        self.pool_id: str | None = None

    async def async_start(self) -> None:
        """Start after config entries have finished loading."""
        entries: list[ConfigEntry] = self.hass.config_entries.async_entries("ondilo_ico")
        if not entries:
            _LOGGER.warning("Native Ondilo ICO integration is not configured")
            return

        native_entry = entries[0]
        runtime_data = getattr(native_entry, "runtime_data", None)
        api = getattr(runtime_data, "api", None)
        self.session = getattr(api, "session", None)
        data = getattr(runtime_data, "data", None) or {}
        self.pool_id = next(iter(data), None)
        if self.session is None or self.pool_id is None:
            _LOGGER.warning("Ondilo ICO runtime data is not ready")
            return

        await self.async_update()
        self.remove_interval = async_track_time_interval(
            self.hass, self.async_update, POLL_INTERVAL
        )

    async def async_update(self, _now=None) -> None:
        """Fetch recommendations and the live ICO configuration."""
        if self.session is None or self.pool_id is None:
            return

        try:
            recommendations_response = await self.session.async_request(
                "GET", f"{API_BASE}/pools/{self.pool_id}/recommendations"
            )
            configuration_response = await self.session.async_request(
                "GET", f"{API_BASE}/pools/{self.pool_id}/configuration"
            )
            if recommendations_response.status != 200 or configuration_response.status != 200:
                raise RuntimeError(
                    f"ICO API returned {recommendations_response.status}/{configuration_response.status}"
                )
            recommendations_payload = await recommendations_response.json()
            configuration_payload = await configuration_response.json()
            recommendations = [_normalise_recommendation(item) for item in _items(recommendations_payload)]
            configuration = configuration_payload.get("data", configuration_payload) if isinstance(configuration_payload, dict) else {}
            attributes = {
                "friendly_name": "ICO recommendations",
                "recommendations": recommendations,
                "summary": f"{len(recommendations)} active recommendation(s)" if recommendations else "No active recommendations",
                "configuration": configuration,
                "source": "Ondilo ICO Customer API",
            }
            self.hass.states.async_set(
                "sensor.spa_ico_recommendation", str(len(recommendations)), attributes
            )
        except Exception as err:  # noqa: BLE001 - keep dashboard available if cloud API is down
            _LOGGER.warning("Unable to update ICO recommendations: %s", err)


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the bridge from configuration.yaml."""
    bridge = RecommendationBridge(hass)
    hass.data[DOMAIN] = bridge

    async def start(_event) -> None:
        await bridge.async_start()

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, start)
    return True


async def async_unload(hass: HomeAssistant) -> bool:
    """Stop polling when the integration unloads."""
    bridge: RecommendationBridge | None = hass.data.pop(DOMAIN, None)
    if bridge and bridge.remove_interval:
        bridge.remove_interval()
    return True
