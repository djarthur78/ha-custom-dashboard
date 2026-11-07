export function parseNumericState(value) {
  if (value == null || value === '') return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
