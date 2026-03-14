/**
 * useTodoList Hook
 * Fetches and manages todo items from a HA todo entity (Todoist integration)
 */

import { useState, useEffect, useCallback } from 'react';
import haWebSocket from '../../../../services/ha-websocket';

export function useTodoList(entityId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      const result = await haWebSocket.send({
        type: 'todo/item/list',
        entity_id: entityId,
      });
      setItems(result?.items || []);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[useTodoList] Failed to fetch items:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    setLoading(true);
    setItems([]);

    const status = haWebSocket.getStatus();
    let unsubscribeConnection;

    if (status === 'connected') {
      fetchItems();
    } else {
      unsubscribeConnection = haWebSocket.onConnectionChange((newStatus) => {
        if (newStatus === 'connected') {
          fetchItems();
        }
      });
    }

    // Re-fetch when entity state changes (item added/removed/completed externally)
    const unsubscribeEntity = haWebSocket.subscribeToEntity(entityId, () => {
      fetchItems();
    });

    return () => {
      unsubscribeEntity();
      if (unsubscribeConnection) unsubscribeConnection();
    };
  }, [entityId, fetchItems]);

  const activeItems = items.filter(i => i.status === 'needs_action');
  const completedItems = items.filter(i => i.status === 'completed');

  const addItem = useCallback(async (summary, description) => {
    try {
      const serviceData = { entity_id: entityId, item: summary };
      if (description) serviceData.description = description;
      await haWebSocket.callService('todo', 'add_item', serviceData);
      await fetchItems();
    } catch (err) {
      console.error('[useTodoList] Failed to add item:', err);
      throw err;
    }
  }, [entityId, fetchItems]);

  const updateItem = useCallback(async (uid, changes) => {
    try {
      // Find the item by uid to get its current summary (needed as identifier)
      const item = items.find(i => i.uid === uid);
      if (!item) throw new Error('Item not found');

      const serviceData = { entity_id: entityId, item: item.summary };
      if (changes.rename) serviceData.rename = changes.rename;
      if (changes.status) serviceData.status = changes.status;
      if (changes.description !== undefined) serviceData.description = changes.description;
      if (changes.due) serviceData.due = changes.due;

      await haWebSocket.callService('todo', 'update_item', serviceData);
      await fetchItems();
    } catch (err) {
      console.error('[useTodoList] Failed to update item:', err);
      throw err;
    }
  }, [entityId, items, fetchItems]);

  const removeItem = useCallback(async (uid) => {
    try {
      const item = items.find(i => i.uid === uid);
      if (!item) throw new Error('Item not found');

      await haWebSocket.callService('todo', 'remove_item', {
        entity_id: entityId,
        item: item.summary,
      });
      await fetchItems();
    } catch (err) {
      console.error('[useTodoList] Failed to remove item:', err);
      throw err;
    }
  }, [entityId, items, fetchItems]);

  const clearCompleted = useCallback(async () => {
    try {
      const removePromises = completedItems.map(item =>
        haWebSocket.callService('todo', 'remove_item', {
          entity_id: entityId,
          item: item.summary,
        })
      );
      await Promise.all(removePromises);
      await fetchItems();
    } catch (err) {
      console.error('[useTodoList] Failed to clear completed:', err);
      throw err;
    }
  }, [entityId, completedItems, fetchItems]);

  return {
    items,
    activeItems,
    completedItems,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCompleted,
  };
}

export default useTodoList;
