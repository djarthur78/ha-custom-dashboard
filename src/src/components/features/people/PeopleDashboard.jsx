import { useState } from 'react';
import { Users, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { usePeople } from './hooks/usePeople';
import { PersonCard } from './PersonCard';
import { LocationMap } from './LocationMap';

/**
 * People Dashboard Component
 * Two-panel layout: person cards (25%) + map (75%)
 */
export function PeopleDashboard() {
  const { people, loading, peopleAtHome, peopleAway } = usePeople();
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [showZones, setShowZones] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [hiddenPeople, setHiddenPeople] = useState(new Set());

  const togglePersonVisibility = (personId) => {
    setHiddenPeople(prev => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const visiblePeople = people.filter(p => !hiddenPeople.has(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Left Panel: Person Cards (25%) */}
      <div className="flex-[25] flex flex-col gap-2 overflow-hidden">
        {/* Summary Header */}
        <div className="bg-[var(--color-surface)] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-text)]">
              <Users size={18} />
              <span className="font-semibold text-sm">Family Status</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCompactView(!compactView)}
                className="p-1 hover:bg-[var(--color-primary)]/10 rounded transition-colors"
                title={compactView ? "Expanded view" : "Compact view"}
              >
                {compactView ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => setShowZones(!showZones)}
                className="p-1 hover:bg-[var(--color-primary)]/10 rounded transition-colors"
                title={showZones ? "Hide zones" : "Show zones"}
              >
                {showZones ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[var(--color-text-secondary)]">
                {peopleAtHome} home
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-[var(--color-text-secondary)]">
                {peopleAway} away
              </span>
            </div>
          </div>
        </div>

        {/* Person Visibility Toggles */}
        <div className="bg-[var(--color-surface)] rounded-lg p-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {people.map(person => (
              <button
                key={person.id}
                onClick={() => togglePersonVisibility(person.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  hiddenPeople.has(person.id)
                    ? 'bg-gray-500/20 text-gray-400 line-through'
                    : 'text-white'
                }`}
                style={{
                  backgroundColor: hiddenPeople.has(person.id) ? undefined : person.color,
                }}
              >
                {person.label}
              </button>
            ))}
          </div>
        </div>

        {/* Person Cards - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {visiblePeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              isSelected={selectedPersonId === person.id}
              onSelect={setSelectedPersonId}
              compact={compactView}
            />
          ))}
        </div>
      </div>

      {/* Right Panel: Map (75%) */}
      <div className="flex-[75] bg-[var(--color-surface)] rounded-xl overflow-hidden">
        <LocationMap
          people={visiblePeople}
          selectedPersonId={selectedPersonId}
          showZones={showZones}
        />
      </div>
    </div>
  );
}
