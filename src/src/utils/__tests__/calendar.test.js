import { describe, it, expect } from 'vitest';
import { isEventOnDay } from '../calendar';

describe('isEventOnDay', () => {
  // Helper to create events
  const makeEvent = (startStr, endStr) => ({
    start: new Date(startStr),
    end: new Date(endStr),
  });

  it('returns true for single-day event on its day', () => {
    const event = makeEvent('2026-02-05T09:00:00', '2026-02-05T17:00:00');
    expect(isEventOnDay(event, new Date('2026-02-05T12:00:00'))).toBe(true);
  });

  it('returns false for single-day event on a different day', () => {
    const event = makeEvent('2026-02-05T09:00:00', '2026-02-05T17:00:00');
    expect(isEventOnDay(event, new Date('2026-02-06T12:00:00'))).toBe(false);
  });

  it('returns true for multi-day event on intermediate day', () => {
    // Zurich trip: Jan 30 - Feb 7 (exclusive end)
    const event = makeEvent('2026-01-30', '2026-02-07');
    expect(isEventOnDay(event, new Date('2026-02-04T12:00:00'))).toBe(true);
  });

  it('returns true for multi-day event on start day', () => {
    const event = makeEvent('2026-01-30', '2026-02-07');
    expect(isEventOnDay(event, new Date('2026-01-30T12:00:00'))).toBe(true);
  });

  it('returns true for multi-day event on last visible day (day before exclusive end)', () => {
    const event = makeEvent('2026-01-30', '2026-02-07');
    expect(isEventOnDay(event, new Date('2026-02-06T12:00:00'))).toBe(true);
  });

  it('returns false for multi-day event on exclusive end date', () => {
    // HA all-day events use exclusive end dates
    const event = makeEvent('2026-01-30', '2026-02-07');
    expect(isEventOnDay(event, new Date('2026-02-07T12:00:00'))).toBe(false);
  });

  it('returns false for multi-day event on day before start', () => {
    const event = makeEvent('2026-01-30', '2026-02-07');
    expect(isEventOnDay(event, new Date('2026-01-29T12:00:00'))).toBe(false);
  });

  it('handles all-day single-day event (exclusive end = next day midnight)', () => {
    // HA returns start: "2026-02-05", end: "2026-02-06" for a single all-day event
    const event = makeEvent('2026-02-05', '2026-02-06');
    expect(isEventOnDay(event, new Date('2026-02-05T12:00:00'))).toBe(true);
    expect(isEventOnDay(event, new Date('2026-02-06T12:00:00'))).toBe(false);
  });
});
