/**
 * TodoPage Component
 * Desktop to-do list — wall panel optimised (1920x1080)
 * Three Todoist lists as tabs with person assignment
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, ListChecks } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useTodoList } from '../components/features/todo/hooks/useTodoList';
import { TodoAddBar } from '../components/features/todo/TodoAddBar';
import { TodoItem } from '../components/features/todo/TodoItem';
import { TodoEditModal } from '../components/features/todo/TodoEditModal';

const LISTS = [
  { id: 'todo.nic_and_daz', label: 'Nic & Daz', emoji: '🏠' },
  { id: 'todo.this_week', label: 'This Week', emoji: '📅' },
  { id: 'todo.this_month', label: 'This Month', emoji: '📆' },
];

export function TodoPage() {
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
      <PageContainer>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Tab bar */}
        <div
          className="flex gap-2 p-1.5 rounded-2xl"
          style={{ backgroundColor: 'var(--ds-card)', border: '1px solid var(--ds-border)' }}
        >
          {LISTS.map((list) => {
            const isActive = selectedList === list.id;
            return (
              <button
                key={list.id}
                onClick={() => { setSelectedList(list.id); setShowCompleted(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl transition-all"
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--ds-accent)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(181,69,58,0.25)',
                      }
                    : { color: 'var(--ds-text-secondary)' }
                }
              >
                <span>{list.emoji}</span>
                <span>{list.label}</span>
              </button>
            );
          })}
        </div>

        {/* Add bar */}
        <TodoAddBar onAdd={addItem} />

        {/* Items list */}
        <div
          className="ds-card overflow-hidden"
          style={{ padding: 0, border: '1px solid var(--ds-border)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="w-7 h-7 border-2 rounded-full animate-spin"
                style={{ borderColor: '#e2e2e6', borderTopColor: 'var(--ds-accent)' }}
              />
            </div>
          ) : activeItems.length === 0 && completedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{ width: 56, height: 56, backgroundColor: 'rgba(181,69,58,0.08)' }}
              >
                <ListChecks size={28} style={{ color: 'var(--ds-accent)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--ds-text-secondary)' }}>
                All clear! Add something above.
              </p>
            </div>
          ) : (
            <>
              {/* Active items */}
              {activeItems.length > 0 && (
                <div
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--ds-text-secondary)', backgroundColor: 'rgba(0,0,0,0.02)' }}
                >
                  To do ({activeItems.length})
                </div>
              )}
              {activeItems.map((item) => (
                <TodoItem
                  key={item.uid}
                  item={item}
                  onToggle={handleToggle}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                />
              ))}

              {/* Completed section */}
              {completedItems.length > 0 && (
                <>
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      borderTop: '1px solid var(--ds-border)',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--ds-text-secondary)' }}
                    >
                      {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Done ({completedItems.length})
                    </button>
                    <button
                      onClick={clearCompleted}
                      className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors hover:bg-black/[0.05]"
                      style={{ color: 'var(--ds-accent)' }}
                    >
                      Clear all
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

      {/* Edit modal */}
      <TodoEditModal
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItem}
      />
    </PageContainer>
  );
}

export default TodoPage;
