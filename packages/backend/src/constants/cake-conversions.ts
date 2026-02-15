/**
 * Cake tin conversion multipliers based on area ratios.
 * Source: Cakes by Lynz methodology (area-based scaling)
 *
 * Multiplier = (target size / source size)²
 * e.g., 6" to 8" round = (8/6)² = 1.78
 */

// Round tin conversion multipliers
// Usage: ROUND_CONVERSIONS[fromSize][toSize] = multiplier
export const ROUND_CONVERSIONS: Record<number, Record<number, number>> = {
  4: { 4: 1.00, 5: 1.56, 6: 2.25, 7: 3.06, 8: 4.00, 9: 5.06, 10: 6.25, 12: 9.00 },
  5: { 4: 0.64, 5: 1.00, 6: 1.44, 7: 1.96, 8: 2.56, 9: 3.24, 10: 4.00, 12: 5.76 },
  6: { 4: 0.44, 5: 0.69, 6: 1.00, 7: 1.36, 8: 1.78, 9: 2.25, 10: 2.78, 12: 4.00 },
  7: { 4: 0.33, 5: 0.51, 6: 0.73, 7: 1.00, 8: 1.31, 9: 1.65, 10: 2.04, 12: 2.94 },
  8: { 4: 0.25, 5: 0.39, 6: 0.56, 7: 0.77, 8: 1.00, 9: 1.27, 10: 1.56, 12: 2.25 },
  9: { 4: 0.20, 5: 0.31, 6: 0.44, 7: 0.60, 8: 0.79, 9: 1.00, 10: 1.23, 12: 1.78 },
  10: { 4: 0.16, 5: 0.25, 6: 0.36, 7: 0.49, 8: 0.64, 9: 0.81, 10: 1.00, 12: 1.44 },
  12: { 4: 0.11, 5: 0.17, 6: 0.25, 7: 0.34, 8: 0.44, 9: 0.56, 10: 0.69, 12: 1.00 },
};

// Square tin conversion multipliers
// Usage: SQUARE_CONVERSIONS[fromSize][toSize] = multiplier
export const SQUARE_CONVERSIONS: Record<number, Record<number, number>> = {
  4: { 4: 1.00, 5: 1.56, 6: 2.25, 7: 3.06, 8: 4.00, 9: 5.06, 10: 6.25, 12: 9.00 },
  5: { 4: 0.64, 5: 1.00, 6: 1.44, 7: 1.96, 8: 2.56, 9: 3.24, 10: 4.00, 12: 5.76 },
  6: { 4: 0.44, 5: 0.69, 6: 1.00, 7: 1.36, 8: 1.78, 9: 2.25, 10: 2.78, 12: 4.00 },
  7: { 4: 0.33, 5: 0.51, 6: 0.73, 7: 1.00, 8: 1.31, 9: 1.65, 10: 2.04, 12: 2.94 },
  8: { 4: 0.25, 5: 0.39, 6: 0.56, 7: 0.77, 8: 1.00, 9: 1.27, 10: 1.56, 12: 2.25 },
  9: { 4: 0.20, 5: 0.31, 6: 0.44, 7: 0.60, 8: 0.79, 9: 1.00, 10: 1.23, 12: 1.78 },
  10: { 4: 0.16, 5: 0.25, 6: 0.36, 7: 0.49, 8: 0.64, 9: 0.81, 10: 1.00, 12: 1.44 },
  12: { 4: 0.11, 5: 0.17, 6: 0.25, 7: 0.34, 8: 0.44, 9: 0.56, 10: 0.69, 12: 1.00 },
};

// Round to Square equivalents (a square tin holds ~25% more than same-size round)
// A round tin is equivalent to a square tin 2" smaller
export const ROUND_TO_SQUARE_EQUIVALENT: Record<number, number> = {
  6: 5,   // 6" round ≈ 5" square
  7: 6,   // 7" round ≈ 6" square
  8: 7,   // 8" round ≈ 7" square
  9: 8,   // 9" round ≈ 8" square
  10: 9,  // 10" round ≈ 9" square
  12: 10, // 12" round ≈ 10" square
};

// Helper function to get conversion multiplier
export function getConversionMultiplier(
  fromSize: number,
  toSize: number,
  fromShape: 'round' | 'square',
  toShape: 'round' | 'square'
): number {
  // Calculate areas
  const fromArea = fromShape === 'round'
    ? Math.PI * Math.pow(fromSize / 2, 2)
    : fromSize * fromSize;

  const toArea = toShape === 'round'
    ? Math.PI * Math.pow(toSize / 2, 2)
    : toSize * toSize;

  return Math.round((toArea / fromArea) * 100) / 100;
}

// Format multiplier for display
export function formatMultiplier(multiplier: number): string {
  if (multiplier === 1) return 'same';
  if (multiplier < 1) {
    // Common fractions for scaling down
    if (Math.abs(multiplier - 0.5) < 0.05) return '½×';
    if (Math.abs(multiplier - 0.25) < 0.05) return '¼×';
    if (Math.abs(multiplier - 0.33) < 0.05) return '⅓×';
    if (Math.abs(multiplier - 0.67) < 0.05) return '⅔×';
    if (Math.abs(multiplier - 0.75) < 0.05) return '¾×';
  } else {
    // Common fractions for scaling up
    if (Math.abs(multiplier - 1.5) < 0.05) return '1½×';
    if (Math.abs(multiplier - 2) < 0.05) return '2×';
    if (Math.abs(multiplier - 2.25) < 0.05) return '2¼×';
    if (Math.abs(multiplier - 2.5) < 0.05) return '2½×';
    if (Math.abs(multiplier - 3) < 0.05) return '3×';
    if (Math.abs(multiplier - 4) < 0.05) return '4×';
  }
  return `${multiplier}×`;
}
