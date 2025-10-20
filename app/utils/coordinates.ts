/**
 * Utility functions for converting between real-world coordinates (meters) and pixel coordinates
 */

export function metersToPixels(meters: number, PixelsPerMeters: number): number {
  return meters * PixelsPerMeters
}

export function pixelsToMeters(pixels: number, PixelsPerMeters: number): number {
  return pixels / PixelsPerMeters
}
