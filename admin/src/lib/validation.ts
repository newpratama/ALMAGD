/**
 * Shared validation helpers for forms and modals so incomplete saves always
 * produce clear field-specific warnings and bring the user to the invalid field.
 */

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Formats a clear user-facing warning naming every incomplete or invalid field.
 */
export function formatMissingFieldsMessage(
  missingFields: string[],
  t: TranslateFn,
  extraDetails: string[] = []
): string {
  const parts: string[] = [];

  const uniqueFields = Array.from(new Set(missingFields.map((f) => f.trim()).filter(Boolean)));
  if (uniqueFields.length > 0) {
    parts.push(
      t('validation.missingFields', {
        fields: uniqueFields.join(t('validation.listSeparator')),
      })
    );
  }

  for (const detail of extraDetails) {
    const trimmed = detail.trim();
    if (trimmed && !parts.includes(trimmed)) {
      parts.push(trimmed);
    }
  }

  return parts.join(' — ');
}

/**
 * Scrolls to and focuses the first invalid field inside a form or modal container.
 */
export function focusFirstInvalidField(container: HTMLElement | null): void {
  if (!container) return;
  const target = container.querySelector<HTMLElement>(
    '[data-invalid="true"], [aria-invalid="true"], .border-danger'
  );
  if (!target) return;

  target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });

  const focusable = target.matches('input, select, textarea, button')
    ? target
    : target.querySelector<HTMLElement>('input, select, textarea, button');
  focusable?.focus?.({ preventScroll: true });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value.trim());
}
