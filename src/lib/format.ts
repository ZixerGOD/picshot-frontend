/** Formato de precio único para toda la app (la plataforma opera en euros). */
export function formatPrice(amount: number): string {
  return `€${amount.toFixed(2)}`
}
