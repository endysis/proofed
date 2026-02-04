import type { ContainerType } from '@proofed/shared';

export const CONTAINER_TYPES: { value: ContainerType; label: string }[] = [
  { value: 'round_cake_tin', label: 'Round Cake Tin' },
  { value: 'square_cake_tin', label: 'Square Cake Tin' },
  { value: 'loaf_tin', label: 'Loaf Tin' },
  { value: 'bundt_tin', label: 'Bundt Tin' },
  { value: 'sheet_pan', label: 'Sheet Pan' },
  { value: 'muffin_tin', label: 'Muffin Tin' },
  { value: 'other', label: 'Other' },
];

export const CONTAINER_SIZES = [4, 5, 6, 7, 8, 9, 10, 12];

export function getContainerLabel(type: ContainerType): string {
  return CONTAINER_TYPES.find(c => c.value === type)?.label || type;
}

export function formatContainer(
  type: ContainerType,
  size: number,
  count: number,
  scaleFactor: number = 1
): string {
  const scaledCount = Math.round(count * scaleFactor * 10) / 10;
  const label = getContainerLabel(type);
  return `${scaledCount} × ${size}" ${label}${scaledCount !== 1 ? 's' : ''}`;
}
