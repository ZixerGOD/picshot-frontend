import type { AnalyticsData } from '../types'

export function generateMockAnalytics(): AnalyticsData[] {
  const data: AnalyticsData[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const visits = Math.floor(Math.random() * 2000) + 300
    const pageViews = Math.floor(visits * (1.5 + Math.random()))
    const uniqueVisitors = Math.floor(visits * 0.7)
    const sales = Math.floor(Math.random() * 40) + 2
    const revenue = sales * (15 + Math.random() * 15)
    data.push({
      date: date.toISOString().split('T')[0],
      visits,
      pageViews,
      uniqueVisitors,
      sales,
      revenue,
    })
  }
  return data
}

export const mockAnalytics: AnalyticsData[] = generateMockAnalytics()
