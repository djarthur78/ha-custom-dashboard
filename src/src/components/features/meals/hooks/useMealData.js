/**
 * useMealData Hook
 * Fetches all meal data for a specific week (w1 or w2)
 * Returns meals organized by day and meal type
 */

import { useState, useEffect } from 'react';
import haWebSocket from '../../../../services/ha-websocket';
import entitiesConfig from '../../../../../../config/entities.json';

const DAYS = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'cakes'];

/**
 * Hook to fetch meal data for a specific week
 * @param {string} week - 'w1' (This Week) or 'w2' (Next Week)
 * @returns {Object} - { meals, loading, error, updateMeal }
 */
export function useMealData(week) {
  const [meals, setMeals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate week
    const weekData = entitiesConfig.mealPlanner.weeks[week];
    if (!weekData) {
      // Set error state in async manner
      Promise.resolve().then(() => {
        setError(`Invalid week: ${week}`);
        setLoading(false);
      });
      return;
    }

    // Build entity ID list for this week
    const entityIds = DAYS.flatMap(day =>
      MEAL_TYPES.map(mealType => weekData.days[day][mealType])
    );

    // Fetch initial states for all meal entities
    const fetchMealStates = async () => {
      try {
        const states = {};

        // Get current states for all entities
        for (const day of DAYS) {
          states[day] = {};
          for (const mealType of MEAL_TYPES) {
            const entityId = weekData.days[day][mealType];
            states[day][mealType] = {
              entityId,
              value: '',
            };
          }
        }

        // Get states from WebSocket service - FIX: await the async call
        const allStates = await haWebSocket.getStates();
        console.log('[useMealData] Fetched states from HA:', allStates?.length, 'entities');

        if (allStates) {
          // Convert array to object keyed by entity_id for faster lookup
          const statesMap = {};
          allStates.forEach(state => {
            statesMap[state.entity_id] = state;
          });

          for (const day of DAYS) {
            for (const mealType of MEAL_TYPES) {
              const entityId = weekData.days[day][mealType];
              const entityState = statesMap[entityId];
              if (entityState) {
                console.log(`[useMealData] ${entityId} = "${entityState.state}"`);
                states[day][mealType].value = entityState.state || '';
              }
            }
          }
        }

        setMeals(states);
        setLoading(false);
      } catch (err) {
        console.error('[useMealData] Error fetching meal states:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Check if already connected, otherwise wait for connection
    const status = haWebSocket.getStatus();

    // Subscribe to connection changes if not yet connected
    let unsubscribeConnection;
    if (status !== 'connected') {
      console.log('[useMealData] Waiting for WebSocket connection...');
      unsubscribeConnection = haWebSocket.onConnectionChange((newStatus) => {
        console.log('[useMealData] Connection status changed:', newStatus);
        if (newStatus === 'connected') {
          fetchMealStates();
        }
      });
    } else {
      fetchMealStates();
    }

    // Subscribe to state changes for all meal entities
    const unsubscribeFunctions = entityIds.map(entityId => {
      return haWebSocket.subscribeToEntity(entityId, (newState) => {
        // Find which day and meal type this entity belongs to
        for (const day of DAYS) {
          for (const mealType of MEAL_TYPES) {
            if (weekData.days[day][mealType] === entityId) {
              setMeals(prevMeals => ({
                ...prevMeals,
                [day]: {
                  ...prevMeals[day],
                  [mealType]: {
                    entityId,
                    value: newState?.state || '',
                  },
                },
              }));
              return;
            }
          }
        }
      });
    });

    return () => {
      // Unsubscribe from all entities on unmount
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      // Also unsubscribe from connection listener if it exists
      if (unsubscribeConnection) {
        unsubscribeConnection();
      }
    };
  }, [week]);

  // Function to update a meal value
  const updateMeal = async (day, mealType, value) => {
    const weekData = entitiesConfig.mealPlanner.weeks[week];
    const entityId = weekData.days[day][mealType];

    console.log(`[useMealData] Updating ${entityId} to: "${value}"`);

    try {
      const result = await haWebSocket.callService('input_text', 'set_value', {
        entity_id: entityId,
        value: value,
      });

      console.log(`[useMealData] Service call successful for ${entityId}`, result);

      // Optimistically update local state
      setMeals(prevMeals => ({
        ...prevMeals,
        [day]: {
          ...prevMeals[day],
          [mealType]: {
            ...prevMeals[day][mealType],
            value,
          },
        },
      }));

      return true;
    } catch (err) {
      console.error(`[useMealData] Failed to update ${entityId}:`, err);
      return false;
    }
  };

  return { meals, loading, error, updateMeal };
}

export default useMealData;
