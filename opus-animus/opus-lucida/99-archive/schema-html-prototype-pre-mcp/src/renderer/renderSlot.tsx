import type { SlideSlots } from '../schema/deck';

export function getText(slots: SlideSlots, key: string, fallback = ''): string {
  const value = slots[key];
  return typeof value === 'string' ? value : fallback;
}

export function getTextList(slots: SlideSlots, key: string): string[] {
  const value = slots[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function getRows(slots: SlideSlots, key: string): Array<{ label: string; value: string; note?: string }> {
  const value = slots[key];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { label: string; value: string; note?: string } =>
      typeof item === 'object' && item !== null && 'label' in item && 'value' in item
  );
}
