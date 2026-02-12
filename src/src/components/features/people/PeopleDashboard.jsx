import { useState } from 'react';
import { Users } from 'lucide-react';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { usePeople } from './hooks/usePeople';
import { PersonCard } from './PersonCard';
import { LocationMap } from './LocationMap';

/**
 * People Dashboard Component
 * Two-panel layout: person cards (35%) + map (65%)
 */
export function PeopleDashboard() {
  const { people, loading, peopleAtHome, peopleAway } = usePeople();
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Left Panel: Person Cards (35%) */}
      <div className="flex-[35] flex flex-col gap-3 overflow-hidden">
        {/* Summary Header */}
        <div className="bg-[var(--color-surface)] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[var(--color-text)]">
            <Users size={20} />
            <span className="font-semibold">Family Status</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[var(--color-text-secondary)]">
                {peopleAtHome} home
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-[var(--color-text-secondary)]">
                {peopleAway} away
              </span>
            </div>
          </div>
        </div>

        {/* Person Cards - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {people.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              isSelected={selectedPersonId === person.id}
              onSelect={setSelectedPersonId}
            />
          ))}
        </div>
      </div>

      {/* Right Panel: Map (65%) */}
      <div className="flex-[65] bg-[var(--color-surface)] rounded-xl overflow-hidden">
        <LocationMap people={people} selectedPersonId={selectedPersonId} />
      </div>
    </div>
  );
}
