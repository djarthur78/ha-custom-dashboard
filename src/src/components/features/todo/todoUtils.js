/**
 * Todo utilities
 * Person parsing and colour constants
 */

// Colours matching calendar.js — Daz blue, Nic pink
export const PERSON_COLORS = {
  Daz: { bg: '#2962FF', text: '#ffffff' },
  Nic: { bg: '#F4A6B8', text: '#000000' },
};

const PERSON_PREFIXES = ['Daz: ', 'Nic: ', 'daz: ', 'nic: '];

/**
 * Parse person prefix from summary
 * "Daz: Fix shed" → { person: 'Daz', text: 'Fix shed' }
 * "Buy milk" → { person: null, text: 'Buy milk' }
 */
export function parsePerson(summary) {
  for (const prefix of PERSON_PREFIXES) {
    if (summary.startsWith(prefix)) {
      const name = prefix[0].toUpperCase() + prefix.slice(1, prefix.indexOf(':'));
      return { person: name, text: summary.slice(prefix.length) };
    }
  }
  return { person: null, text: summary };
}

/**
 * Build summary with person prefix
 */
export function buildSummary(text, person) {
  if (!person) return text;
  return `${person}: ${text}`;
}
