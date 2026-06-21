/**
 * Barrel de tipos del dominio.
 *
 * Los archivos están agrupados por dominio (events, photos, cart, etc.).
 * Cualquier consumidor sigue importando desde `../lib/types` (o
 * `../../lib/types`) sin enterarse del split interno.
 */
export * from './auth'
export * from './analytics'
export * from './cart'
export * from './commerce'
export * from './events'
export * from './forms'
export * from './orders'
export * from './packs'
export * from './people'
export * from './photos'
