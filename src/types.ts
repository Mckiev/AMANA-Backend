type ObjectRecord = Record<string, unknown>;

export const isObjectRecord = (value: unknown): value is ObjectRecord => (
  typeof value === 'object'
    && !Array.isArray(value)
    && value !== null
);