"""Expose the active Ondilo ICO recommendations in Home Assistant."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval

DOMAIN = "ondilo_ico_recommendations"
API_BASE = "https://interop.ondilo.com/api/customer/v1"
POLL_INTERVAL = timedelta(minutes=5)
COMPLETED_STATUSES = {
    "cancelled",
    "closed",
    "complete",
    "completed",
    "done",
    "ok",
    "resolved",
    "validated",
}
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
        "status": item.get("status"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
        "deadline": item.get("deadline"),
    }


def _is_active(recommendation: dict[str, Any]) -> bool:
    """Exclude completed recommendations if the API includes them."""
    status = str(recommendation.get("status") or "").strip().lower()
    return not status or status not in COMPLETED_STATUSES


class RecommendationBridge:
    """Poll ICO recommendations using the native integration's OAuth session."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.remove_interval = None
        self.session = None
        self.pool_id: str | None = None

    async def async_start(self) -> None:
        """Start polling and perform an immediate refresh."""
        if self.remove_interval is None:
            self.remove_interval = async_track_time_interval(
                self.hass, self.async_update, POLL_INTERVAL
            )
        await self.async_update()

    def _resolve_native_runtime(self) -> bool:
        """Resolve the native integration runtime when it becomes available."""
        entries: list[ConfigEntry] = self.hass.config_entries.async_entries("ondilo_ico")
        if not entries:
            return False

        native_entry = entries[0]
        runtime_data = getattr(native_entry, "runtime_data", None)
        api = getattr(runtime_data, "api", None)
        self.session = getattr(api, "session", None)
        data = getattr(runtime_data, "data", None) or {}
        self.pool_id = next(iter(data), None)
        return self.session is not None and self.pool_id is not None

    async def async_update(self, _now=None) -> None:
        """Fetch recommendations and the live ICO configuration."""
        if not self._resolve_native_runtime():
            _LOGGER.warning("Ondilo ICO runtime data is not ready; retrying next poll")
            self.hass.states.async_set(
                "sensor.spa_ico_recommendation",
                "unavailable",
                {
                    "friendly_name": "ICO recommendations",
                    "recommendations": [],
                    "summary": "Waiting for the native Ondilo ICO integration",
                    "source": "Ondilo ICO Customer API",
                    "available": False,
                    "last_attempt_at": datetime.now(UTC).isoformat(),
                },
            )
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
            recommendations = [
                recommendation
                for item in _items(recommendations_payload)
                if _is_active(recommendation := _normalise_recommendation(item))
            ]
            configuration = configuration_payload.get("data", configuration_payload) if isinstance(configuration_payload, dict) else {}
            attributes = {
                "friendly_name": "ICO recommendations",
                "recommendations": recommendations,
                "summary": f"{len(recommendations)} active recommendation(s)" if recommendations else "No active recommendations",
                "configuration": configuration,
                "source": "Ondilo ICO Customer API",
                "refreshed_at": datetime.now(UTC).isoformat(),
                "available": True,
            }
            self.hass.states.async_set(
                "sensor.spa_ico_recommendation", str(len(recommendations)), attributes
            )
        except Exception as err:  # noqa: BLE001 - keep dashboard available if cloud API is down
            _LOGGER.warning("Unable to update ICO recommendations: %s", err)
            self.hass.states.async_set(
                "sensor.spa_ico_recommendation",
                "unavailable",
                {
                    "friendly_name": "ICO recommendations",
                    "recommendations": [],
                    "summary": "ICO recommendations temporarily unavailable",
                    "source": "Ondilo ICO Customer API",
                    "available": False,
                    "last_attempt_at": datetime.now(UTC).isoformat(),
                },
            )


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the bridge from configuration.yaml."""
    bridge = RecommendationBridge(hass)
    hass.data[DOMAIN] = bridge

    async def start(_event) -> None:
        await bridge.async_start()

    if hass.is_running:
        hass.async_create_task(bridge.async_start())
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, start)
    return True


async def async_unload(hass: HomeAssistant) -> bool:
    """Stop polling when the integration unloads."""
    bridge: RecommendationBridge | None = hass.data.pop(DOMAIN, None)
    if bridge and bridge.remove_interval:
        bridge.remove_interval()
    return True
