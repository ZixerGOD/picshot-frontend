export interface AnalyticsData {
  date: string
  visits: number
  pageViews: number
  uniqueVisitors: number
  sales: number
  revenue: number
}

export interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalVisits: number
  totalPhotosSold: number
  activeEvents: number
  activeCoupons: number
  totalPhotographers: number
}
