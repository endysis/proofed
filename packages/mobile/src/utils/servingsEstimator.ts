import type { ContainerInfo } from '@proofed/shared';

// Round cake tin servings based on diameter (inches)
const ROUND_CAKE_SERVINGS: Record<number, number> = {
  4: 4,
  5: 6,
  6: 8,
  7: 10,
  8: 12,
  9: 14,
  10: 16,
  11: 18,
  12: 20,
};

// Square cake tin servings based on side length (inches)
const SQUARE_CAKE_SERVINGS: Record<number, number> = {
  4: 6,
  5: 8,
  6: 12,
  7: 14,
  8: 16,
  9: 20,
  10: 24,
  11: 28,
  12: 32,
};

// Loaf tin servings (approximately 10-12 slices per standard loaf)
const DEFAULT_LOAF_SERVINGS = 10;

// Bundt tin servings per cup of capacity
const BUNDT_SERVINGS_PER_CUP = 2;

// Sheet pan servings based on type (approximated from dimensions)
function getSheetPanServings(length?: number, width?: number): number {
  if (!length || !width) return 24; // Default half sheet

  const area = length * width;
  // Quarter sheet (~12x9): 12 servings
  // Half sheet (~18x13): 24 servings
  // Full sheet (~26x18): 48 servings
  if (area < 150) return 12; // quarter
  if (area < 300) return 24; // half
  return 48; // full
}

// Muffin servings based on cups per tray and count
function getMuffinServings(cupsPerTray: number = 12, count: number = 1): number {
  return cupsPerTray * count;
}

/**
 * Estimate the number of servings based on container info
 *
 * @param containerInfo - Container information from recipe
 * @param scaleFactor - Scale factor to apply (default 1)
 * @returns Estimated number of servings
 */
export function estimateServings(
  containerInfo: ContainerInfo,
  scaleFactor: number = 1
): number {
  const { type, count = 1 } = containerInfo;
  let baseServings: number;

  switch (type) {
    case 'round_cake_tin': {
      const size = containerInfo.size || 8; // Default 8" if not specified
      // Find the closest size match
      const closestSize = Object.keys(ROUND_CAKE_SERVINGS)
        .map(Number)
        .reduce((prev, curr) =>
          Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
        );
      baseServings = ROUND_CAKE_SERVINGS[closestSize] * count;
      break;
    }

    case 'square_cake_tin': {
      const size = containerInfo.size || 8; // Default 8" if not specified
      const closestSize = Object.keys(SQUARE_CAKE_SERVINGS)
        .map(Number)
        .reduce((prev, curr) =>
          Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
        );
      baseServings = SQUARE_CAKE_SERVINGS[closestSize] * count;
      break;
    }

    case 'loaf_tin': {
      baseServings = DEFAULT_LOAF_SERVINGS * count;
      break;
    }

    case 'bundt_tin': {
      const capacity = containerInfo.capacity || 10; // Default 10-cup bundt
      baseServings = Math.round(capacity * BUNDT_SERVINGS_PER_CUP) * count;
      break;
    }

    case 'sheet_pan': {
      baseServings =
        getSheetPanServings(containerInfo.length, containerInfo.width) * count;
      break;
    }

    case 'muffin_tin': {
      baseServings = getMuffinServings(containerInfo.cupsPerTray, count);
      break;
    }

    case 'other':
    default: {
      // Default fallback: 12 servings
      baseServings = 12 * count;
      break;
    }
  }

  // Apply scale factor (2x batch = 2x servings)
  return Math.round(baseServings * scaleFactor);
}

/**
 * Estimate servings from multiple container infos (if different items have different containers)
 * Takes the maximum servings from all items (since items are combined in one bake)
 *
 * @param containerInfos - Array of container info with scale factors
 * @returns Estimated total servings
 */
export function estimateTotalServings(
  containerInfos: Array<{
    containerInfo: ContainerInfo;
    scaleFactor: number;
  }>
): number {
  if (containerInfos.length === 0) return 12; // Default fallback

  // For combined bakes, use the maximum servings estimate
  // (e.g., cake + frosting = servings determined by cake container)
  return Math.max(
    ...containerInfos.map(({ containerInfo, scaleFactor }) =>
      estimateServings(containerInfo, scaleFactor)
    )
  );
}

/**
 * Get a human-readable description of a container
 *
 * @param containerInfo - Container information
 * @returns Human-readable string
 */
export function formatContainerDescription(containerInfo: ContainerInfo): string {
  const { type, count = 1 } = containerInfo;
  const countPrefix = count > 1 ? `${count}× ` : '';

  switch (type) {
    case 'round_cake_tin':
      return `${countPrefix}${containerInfo.size || 8}" round tin`;
    case 'square_cake_tin':
      return `${countPrefix}${containerInfo.size || 8}" square tin`;
    case 'loaf_tin':
      return `${countPrefix}loaf tin`;
    case 'bundt_tin':
      return `${countPrefix}${containerInfo.capacity || 10}-cup bundt`;
    case 'sheet_pan':
      if (containerInfo.length && containerInfo.width) {
        return `${countPrefix}${containerInfo.length}×${containerInfo.width}" sheet pan`;
      }
      return `${countPrefix}sheet pan`;
    case 'muffin_tin':
      const cupSize = containerInfo.cupSize || 'standard';
      const cupsPerTray = containerInfo.cupsPerTray || 12;
      return `${countPrefix}${cupsPerTray}-cup ${cupSize} muffin tin`;
    case 'other':
    default:
      return `${countPrefix}container`;
  }
}
