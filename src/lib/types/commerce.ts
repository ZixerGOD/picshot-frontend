export interface Coupon {
  id: string
  code: string
  eventId?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

export interface Sale {
  id: string
  photoId: string
  eventId: string
  photographerId: string
  buyerEmail: string
  amount: number
  discountAmount: number
  finalAmount: number
  /** Comisión cobrada por Payphone (5.75% por defecto). */
  payphoneFee?: number
  /** Neto después de Payphone (finalAmount − payphoneFee). */
  netAmount?: number
  photographerEarnings: number
  platformEarnings: number
  createdAt: string
  couponCode?: string
}

/** Comisión Payphone (decisions.md / payments.md). */
export const PAYPHONE_FEE_RATIO = 0.0575
