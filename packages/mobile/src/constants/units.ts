export const UNIT_PRESETS = [
  // Weight
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  // Volume
  { value: 'ml', label: 'ml' },
  { value: 'L', label: 'L' },
  { value: 'tsp', label: 'tsp' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'cup', label: 'cup' },
  { value: 'fl oz', label: 'fl oz' },
  // Count
  { value: 'unit', label: 'unit' },
  { value: 'piece', label: 'piece' },
  { value: 'large', label: 'large' },
  { value: 'medium', label: 'medium' },
  { value: 'small', label: 'small' },
  // Other
  { value: 'pinch', label: 'pinch' },
  { value: 'to taste', label: 'to taste' },
] as const;

export type UnitPreset = (typeof UNIT_PRESETS)[number]['value'];
