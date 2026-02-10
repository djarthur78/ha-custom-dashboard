/**
 * EventSearchFilter Component
 * Search bar and quick filters for calendar events
 */

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';

export function EventSearchFilter({ searchTerm, onSearchChange, quickFilter, onQuickFilterChange }) {
  const [isFocused, setIsFocused] = useState(false);

  const quickFilters = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'upcoming', label: 'Upcoming' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 transition-all ${
            isFocused ? 'border-[var(--color-primary)]' : 'border-gray-200'
          }`}
          style={{ height: '44px' }}
        >
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search events..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text)] placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X size={16} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 mr-1">Quick filter:</span>
        {quickFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onQuickFilterChange(filter.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              quickFilter === filter.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Active filter indicator */}
      {(searchTerm || quickFilter !== 'all') && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">Active filters:</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Search: "{searchTerm}"
            </span>
          )}
          {quickFilter !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
              {quickFilters.find((f) => f.id === quickFilter)?.label}
            </span>
          )}
          <button
            onClick={() => {
              onSearchChange('');
              onQuickFilterChange('all');
            }}
            className="text-[var(--color-primary)] hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Filter events based on search term and quick filter
 */
export function filterEvents(events, searchTerm, quickFilter) {
  let filtered = events;

  // Apply search term filter
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    filtered = filtered.filter((event) => {
      const titleMatch = event.title?.toLowerCase().includes(lowerSearch);
      const descMatch = event.description?.toLowerCase().includes(lowerSearch);
      const locationMatch = event.location?.toLowerCase().includes(lowerSearch);
      return titleMatch || descMatch || locationMatch;
    });
  }

  // Apply quick filter
  if (quickFilter !== 'all') {
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const tomorrow = addDays(today, 1);

    filtered = filtered.filter((event) => {
      switch (quickFilter) {
        case 'today':
          return event.start >= today && event.start < todayEnd;
        case 'week':
          return event.start >= weekStart && event.start <= weekEnd;
        case 'upcoming':
          return event.start >= tomorrow;
        default:
          return true;
      }
    });
  }

  return filtered;
}
