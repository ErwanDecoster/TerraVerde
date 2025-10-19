/**
 * Utility functions for converting between real-world coordinates (meters) and pixel coordinates
 */

/**
 * Convert meters to pixels using the garden's scale
 * @param meters - Value in meters
 * @param PixelsPerMeters - How many pixels each meter represents
 * @returns Value in pixels
 */
export function metersToPixels(meters: number, PixelsPerMeters: number): number {
  return meters / PixelsPerMeters
}

/**
 * Convert pixels to meters using the garden's scale
 * @param pixels - Value in pixels
 * @param PixelsPerMeters - How many pixels each meter represents
 * @returns Value in meters
 */
export function pixelsToMeters(pixels: number, PixelsPerMeters: number): number {
  return pixels * PixelsPerMeters
}

/**
 * Convert a real-world position (in meters) to pixel coordinates
 * @param position - Position in meters {x, y}
 * @param PixelsPerMeters - How many pixels each meter represents
 * @returns Position in pixels {x, y}
 */
export function positionToPixels(
  position: { x: number, y: number },
  PixelsPerMeters: number,
): { x: number, y: number } {
  return {
    x: metersToPixels(position.x, PixelsPerMeters),
    y: metersToPixels(position.y, PixelsPerMeters),
  }
}

/**
 * Convert a pixel position to real-world coordinates (in meters)
 * @param position - Position in pixels {x, y}
 * @param PixelsPerMeters - How many pixels each meter represents
 * @returns Position in meters {x, y}
 */
export function positionToMeters(
  position: { x: number, y: number },
  PixelsPerMeters: number,
): { x: number, y: number } {
  return {
    x: pixelsToMeters(position.x, PixelsPerMeters),
    y: pixelsToMeters(position.y, PixelsPerMeters),
  }
}

/**
 * Convert plant dimensions from meters to pixels for display
 * @param plant - Plant data with width and height in meters
 * @param PixelsPerMeters - How many pixels each meter represents
 * @returns Display dimensions in pixels
 */
export function getPlantDisplaySize(
  plant: { width?: number, height?: number },
  PixelsPerMeters: number,
): { width: number, height: number } {
  const defaultSize = 20 // Default size in pixels if no dimensions provided

  return {
    width: plant.width ? metersToPixels(plant.width, PixelsPerMeters) : defaultSize,
    height: plant.height ? metersToPixels(plant.height, PixelsPerMeters) : defaultSize,
  }
}
