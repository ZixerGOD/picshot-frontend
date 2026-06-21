/** Formato de precio único para toda la app (Ecuador, dólares estadounidenses). */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/** Símbolo de la moneda activa, para casos donde no se formatea un número completo. */
export const CURRENCY_SYMBOL = '$'
