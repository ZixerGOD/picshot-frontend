export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin'
  avatarUrl?: string
}

export interface BankInfo {
  bankName: string
  accountType: 'ahorros' | 'corriente'
  accountNumber: string
}

export interface Photographer {
  id: string
  name: string
  email: string
  phone?: string
  city: string
  avatarUrl?: string
  portfolioUrl?: string
  joinedAt: string
  isActive: boolean
  commissionRate: number // 0-100
  eventIds?: string[]
  /** Cédula o RUC del fotógrafo, necesario para emitir comprobantes. */
  identification?: string
  bank?: BankInfo
  /** Última vez que inició sesión. */
  lastLoginAt?: string
  /** Última vez que subió fotos. */
  lastUploadAt?: string
}
