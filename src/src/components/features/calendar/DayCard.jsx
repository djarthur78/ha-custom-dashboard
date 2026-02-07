/**
 * DayCard Component
 * Reusable day cell for week and biweekly calendar views.
 * Shows day number, weather, relative day label, and event list.
 */

import { memo } from 'react';
import { format, isToday } from 'date-fns';
import { getEventStyle } from '../../../constants/colors';
import { getWeatherIcon } from '../../../utils/weather';

/**
 * @param {Object} props
 * @param {Date} props.day - The date this card represents
 * @param {Array} props.events - Events filtered to this day (pre-sorted)
 * @param {Object} [props.weather] - Weather data for this day { condition, temperature, templow }
 * @param {Function} props.onEventClick - Event click handler
 */
export const DayCard = memo(function DayCard({
  day,
  events,
  weather,
  onEventClick,
}) {
  const isCurrentDay = isToday(day);

  const getDayLabel = () => {
    return format(day, 'EEEE');
  };

  return (
    <div
      className="overflow-hidden bg-white"
      style={{
        border: 'solid 1px whitesmoke',
        borderRadius: '8px',
      }}
    >
      {/* Day header */}
      <div style={{ padding: '8px', borderBottom: 'solid 1px whitesmoke' }}>
        <div className="flex items-center justify-between">
          <div
            style={{
              fontSize: '3em',
              fontWeight: 700,
              lineHeight: 1,
              ...(isCurrentDay && {
                borderRadius: '5px',
                backgroundColor: 'orange',
                padding: '0 4px',
                display: 'inline-block'
              })
            }}
          >
            {format(day, 'd')}
          </div>
          {weather && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2em' }}>
                {getWeatherIcon(weather.condition, 28)}
              </div>
              <div style={{ fontSize: '0.75em', color: '#666', fontWeight: 600 }}>
                {Math.round(weather.temperature)}° / {Math.round(weather.templow)}°
              </div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '1em', fontWeight: 700, color: '#666', marginTop: '4px' }}>
          {getDayLabel()}
        </div>
      </div>

      {/* Events list */}
      <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {events.length === 0 ? (
          <div className="text-xs text-[var(--color-text-secondary)] text-center py-2">
            No events
          </div>
        ) : (
          events
            .filter(event => event.calendarId !== 'calendar.basildon_council')
            .map(event => {
              const colors = getEventStyle(event.calendarId);
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    maxHeight: '80px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginBottom: '2px' }}>
                    {!event.allDay && (
                      <>{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</>
                    )}
                    {event.allDay && <>Entire day</>}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.4', fontWeight: '500', color: '#000000' }}>
                    {event.title}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginTop: '2px' }}>
                      {event.location}
                    </div>
                  )}
                </button>
              );
            })
        )}
      </div>
    </div>
  );
});
