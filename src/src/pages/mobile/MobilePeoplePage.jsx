/**
 * MobilePeoplePage
 * Tabbed People/Map layout for mobile
 */

import { useState } from 'react';
import { MobileTabSwitcher } from '../../components/mobile/MobileTabSwitcher';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePeople } from '../../components/features/people/hooks/usePeople';
import { PersonCard } from '../../components/features/people/PersonCard';
import { LocationMap } from '../../components/features/people/LocationMap';

const tabs = [
  { id: 'people', label: 'People' },
  { id: 'map', label: 'Map' },
];

export function MobilePeoplePage() {
  const { people, loading } = usePeople();
  const [activeTab, setActiveTab] = useState('people');
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [hiddenPeople, setHiddenPeople] = useState(new Set());

  const togglePersonVisibility = (personId) => {
    setHiddenPeople(prev => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  };

  const visiblePeople = people.filter(p => !hiddenPeople.has(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 300 }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <MobileTabSwitcher tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Visibility Toggles */}
      <div className="px-3 py-2 flex gap-1.5 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {people.map(person => (
          <button
            key={person.id}
            onClick={() => togglePersonVisibility(person.id)}
            className="flex-shrink-0 w-8 h-8 rounded-full text-[10px] font-bold text-white transition-all"
            style={{
              backgroundColor: hiddenPeople.has(person.id) ? '#d1d5db' : person.color,
              opacity: hiddenPeople.has(person.id) ? 0.5 : 1,
            }}
          >
            {person.label?.[0]}
          </button>
        ))}
      </div>

      {activeTab === 'people' && (
        <div className="px-3 space-y-2 pb-4">
          {visiblePeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              isSelected={selectedPersonId === person.id}
              onSelect={setSelectedPersonId}
              compact={true}
            />
          ))}
        </div>
      )}

      {activeTab === 'map' && (
        <div style={{ height: 'calc(100vh - 44px - 56px - 80px)' }}>
          <LocationMap
            people={visiblePeople}
            selectedPersonId={selectedPersonId}
            showZones={true}
          />
        </div>
      )}
    </div>
  );
}

export default MobilePeoplePage;
