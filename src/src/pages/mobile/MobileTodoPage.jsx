/**
 * MobileTodoPage Component
 * Mobile to-do list backed by Todoist via HA integration
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { useTodoList } from '../../components/features/todo/hooks/useTodoList';
import { TodoAddBar } from '../../components/features/todo/TodoAddBar';
import { TodoItem } from '../../components/features/todo/TodoItem';
import { TodoEditModal } from '../../components/features/todo/TodoEditModal';

const LISTS = [
  { id: 'todo.nic_and_daz', label: 'Nic & Daz' },
  { id: 'todo.this_week', label: 'This Week' },
  { id: 'todo.this_month', label: 'This Month' },
];

export function MobileTodoPage() {
  const [selectedList, setSelectedList] = useState(LISTS[0].id);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const {
    activeItems,
    completedItems,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCompleted,
  } = useTodoList(selectedList);

  const handleToggle = async (uid, isCompleted) => {
    await updateItem(uid, { status: isCompleted ? 'needs_action' : 'completed' });
  };

  const handleDelete = async (uid) => {
    await removeItem(uid);
  };

  if (error) {
    return (
      <MobilePageContainer>
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--ds-card)' }}>
          {LISTS.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className="flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-colors"
              style={
                selectedList === list.id
                  ? { backgroundColor: 'var(--ds-accent)', color: 'white' }
                  : { color: 'var(--ds-text-secondary)' }
              }
            >
              {list.label}
            </button>
          ))}
        </div>

        {/* Add bar */}
        <TodoAddBar onAdd={addItem} />

        {/* Items */}
        <div className="ds-card" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: '#e2e2e6', borderTopColor: 'var(--ds-accent)' }}
              />
            </div>
          ) : activeItems.length === 0 && completedItems.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
              No items yet. Add one above.
            </div>
          ) : (
            <>
              {activeItems.map((item) => (
                <TodoItem
                  key={item.uid}
                  item={item}
                  onToggle={handleToggle}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                />
              ))}

              {completedItems.length > 0 && (
                <>
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ borderTop: '1px solid var(--ds-border)', backgroundColor: 'var(--color-background)' }}
                  >
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: 'var(--ds-text-secondary)' }}
                    >
                      {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Completed ({completedItems.length})
                    </button>
                    <button
                      onClick={clearCompleted}
                      className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-black/[0.05]"
                      style={{ color: 'var(--ds-accent)' }}
                    >
                      Clear
                    </button>
                  </div>

                  {showCompleted &&
                    completedItems.map((item) => (
                      <TodoItem
                        key={item.uid}
                        item={item}
                        onToggle={handleToggle}
                        onEdit={setEditItem}
                        onDelete={handleDelete}
                      />
                    ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <TodoEditModal
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItem}
      />
    </MobilePageContainer>
  );
}

export default MobileTodoPage;
