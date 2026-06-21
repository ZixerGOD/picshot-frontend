/**
 * Helper para imágenes placeholder.
 * Reemplazar por CDN o bucket propio cuando el backend esté listo.
 */
export function img(seed: string, width = 800, height = 600): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}
