/**
 * Formato de precio único para toda la app (Ecuador, dólares estadounidenses).
 *
 * En frontend trabajamos con dólares como número float por simplicidad. El
 * backend almacena en CENTAVOS (decisions.md 129-132): al conectar el API
 * hay que convertir centavos / 100 antes de mostrar y multiplicar al enviar.
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/** Símbolo de la moneda activa, para casos donde no se formatea un número completo. */
export const CURRENCY_SYMBOL = '$'

/**
 * Fecha corta en formato ecuatoriano (DD/MM/AAAA) en timezone
 * America/Guayaquil. decisions.md 170-172 fija ese huso horario.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
  })
}

/** Fecha + hora en formato ecuatoriano (timezone America/Guayaquil). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
  })
}
