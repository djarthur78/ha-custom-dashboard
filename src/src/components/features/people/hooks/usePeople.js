import { useState, useEffect } from 'react';
import haWebSocket from '../../../../services/ha-websocket';
import { useHAConnection } from '../../../../hooks/useHAConnection';
import { FAMILY_MEMBERS, PHONE_SENSORS, getSensorId } from '../peopleConfig';

/**
 * Extract sensor value, returning null for unavailable/unknown
 */
function extractSensorValue(entityId) {
  const state = haWebSocket.getCachedState(entityId);
  if (!state || state.state === 'unavailable' || state.state === 'unknown') {
    return null;
  }
  return state.state;
}

/**
 * Extract person data from entity state
 */
function extractPersonData(personEntity, sensorPrefix) {
  const state = haWebSocket.getCachedState(personEntity);

  if (!state) {
    // Return default values if no state yet
    return {
      state: 'not_home',
      latitude: null,
      longitude: null,
      gpsAccuracy: null,
      entityPicture: null,
      friendlyName: '',
      lastChanged: null,
      batteryLevel: null,
      batteryState: null,
      steps: null,
      distance: null,
      activity: null,
      ssid: null,
      connectionType: null,
      geocodedLocation: null,
      focus: false
    };
  }

  const attributes = state.attributes || {};

  // Extract battery data
  const batteryLevel = extractSensorValue(getSensorId(sensorPrefix, 'battery_level'));
  const batteryState = extractSensorValue(getSensorId(sensorPrefix, 'battery_state'));

  // Extract extended sensors
  const steps = extractSensorValue(getSensorId(sensorPrefix, 'steps'));
  const distance = extractSensorValue(getSensorId(sensorPrefix, 'distance'));
  const activity = extractSensorValue(getSensorId(sensorPrefix, 'activity'));
  const ssid = extractSensorValue(getSensorId(sensorPrefix, 'ssid'));
  const connectionType = extractSensorValue(getSensorId(sensorPrefix, 'connection_type'));
  const geocodedLocation = extractSensorValue(getSensorId(sensorPrefix, 'geocoded_location'));
  const focus = extractSensorValue(getSensorId(sensorPrefix, 'focus'));

  return {
    state: state.state,
    latitude: attributes.latitude || null,
    longitude: attributes.longitude || null,
    gpsAccuracy: attributes.gps_accuracy || null,
    entityPicture: attributes.entity_picture || null,
    friendlyName: attributes.friendly_name || '',
    lastChanged: state.last_changed,
    // Battery
    batteryLevel: batteryLevel ? parseInt(batteryLevel, 10) : null,
    batteryState: batteryState,
    // Extended sensors
    steps: steps ? parseInt(steps, 10) : null,
    distance: distance,
    activity: activity,
    ssid: ssid,
    connectionType: connectionType,
    geocodedLocation: geocodedLocation,
    focus: focus === 'on'
  };
}

/**
 * Hook to manage all people data
 * Subscribes to person entities and phone sensors
 */
export function usePeople() {
  const { isConnected } = useHAConnection();

  // Initialize state from cache (instant load, no flicker)
  const [people, setPeople] = useState(() =>
    FAMILY_MEMBERS.map(member => ({
      ...member,
      ...extractPersonData(member.personEntity, member.sensorPrefix)
    }))
  );

  useEffect(() => {
    if (!isConnected) return;

    // Wait a moment for state cache to populate, then load initial data
    const initTimer = setTimeout(() => {
      setPeople(
        FAMILY_MEMBERS.map(member => ({
          ...member,
          ...extractPersonData(member.personEntity, member.sensorPrefix)
        }))
      );
    }, 500);

    // Build subscription list: person entities + sensors
    const subscriptions = [];

    FAMILY_MEMBERS.forEach(member => {
      // Person entity
      subscriptions.push(member.personEntity);

      // Battery sensors
      subscriptions.push(getSensorId(member.sensorPrefix, 'battery_level'));
      subscriptions.push(getSensorId(member.sensorPrefix, 'battery_state'));

      // Extended phone sensors
      PHONE_SENSORS.forEach(sensorType => {
        if (sensorType !== 'battery_level' && sensorType !== 'battery_state') {
          subscriptions.push(getSensorId(member.sensorPrefix, sensorType));
        }
      });

      // Focus sensor
      subscriptions.push(getSensorId(member.sensorPrefix, 'focus'));
    });

    const updatePeople = () => {
      setPeople(
        FAMILY_MEMBERS.map(member => ({
          ...member,
          ...extractPersonData(member.personEntity, member.sensorPrefix)
        }))
      );
    };

    // Subscribe to updates
    const unsubscribes = subscriptions.map(entityId =>
      haWebSocket.subscribeToEntity(entityId, updatePeople)
    );

    return () => {
      clearTimeout(initTimer);
      unsubscribes.forEach(unsub => unsub());
    };
  }, [isConnected]);

  // Calculate summary stats
  const peopleAtHome = people.filter(p => p.state === 'home').length;
  const peopleAway = people.filter(p => p.state !== 'home').length;

  return {
    people,
    loading: !isConnected,
    peopleAtHome,
    peopleAway
  };
}
