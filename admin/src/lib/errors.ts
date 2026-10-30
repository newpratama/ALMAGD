export function friendlyError(e: unknown): string {
  if (!e) return 'errors.unknown';

  let code: string | undefined;
  let message = '';
  let details = '';

  if (typeof e === 'object' && e !== null) {
    if ('code' in e && typeof (e as { code?: unknown }).code === 'string') {
      code = (e as { code: string }).code;
    }
    if ('message' in e && typeof (e as { message?: unknown }).message === 'string') {
      message = (e as { message: string }).message;
    }
    if ('details' in e && typeof (e as { details?: unknown }).details === 'string') {
      details = (e as { details: string }).details;
    }
    if (e instanceof Error && !message) {
      message = e.message;
    }
  } else if (typeof e === 'string') {
    message = e;
  }

  const combined = `${message} ${details}`.toLowerCase();

  if (code === '23P01' || combined.includes('23p01') || combined.includes('exclusion_violation')) {
    return 'errors.unitNotAvailable';
  }

  if (
    code === '42501' ||
    combined.includes('42501') ||
    combined.includes('row-level security') ||
    combined.includes('forbidden')
  ) {
    return 'errors.forbidden';
  }

  if (code === '23514' || combined.includes('23514') || combined.includes('check constraint')) {
    return 'errors.invalidData';
  }

  if (code === '23503' || combined.includes('23503') || combined.includes('foreign key')) {
    return 'errors.inUse';
  }

  if (
    combined.includes('failed to fetch') ||
    combined.includes('network') ||
    combined.includes('econnrefused')
  ) {
    return 'errors.network';
  }

  return 'errors.unknown';
}
