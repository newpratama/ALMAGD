export const PUBLISHABLE_STATUSES = [
  'USER_CONFIRMED',
  'USER_PROVIDED',
  'OFFICIAL_SOURCE',
  'VERIFIED',
  'VERIFIED_MULTIPLE_SOURCES',
] as const;

export type PublishableStatus = (typeof PUBLISHABLE_STATUSES)[number];

export const NON_PUBLISHABLE_STATUSES = [
  'PUBLIC_SOURCE_ONLY',
  'NEEDS_CONFIRMATION',
  'CONFLICT',
  'SUSPICIOUS',
  'MISSING',
  'SOURCE_NOT_ACCESSIBLE',
] as const;

export type FactStatus = PublishableStatus | (typeof NON_PUBLISHABLE_STATUSES)[number];

export function isPublishable(status?: string | null): boolean {
  if (!status) return false;
  return (PUBLISHABLE_STATUSES as readonly string[]).includes(status);
}

export function isPlaceholder(val: unknown): boolean {
  if (typeof val === 'string') {
    return val.trim().toUpperCase() === 'PLACEHOLDER';
  }
  if (val && typeof val === 'object') {
    return Object.values(val).some((v) => isPlaceholder(v));
  }
  return false;
}
