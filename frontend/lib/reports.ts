import api from './api'
import { format, subDays } from 'date-fns'

export interface ProfitLossRow {
  category_name: string
  category_type: string
  total_amount: number
  transaction_count: number
}

export interface ProfitLossResponse {
  data: ProfitLossRow[]
  execution_time_ms: number
  cached: boolean
}

export interface RevenueByCategoryRow {
  category_name: string
  revenue_amount: number
  transaction_count: number
  average_transaction: number
}

export interface RevenueByCategoryResponse {
  data: RevenueByCategoryRow[]
  execution_time_ms: number
  cached: boolean
}

export interface TopCustomerRow {
  customer_id: string
  customer_name: string
  total_revenue: number
  transaction_count: number
  average_transaction: number
}

export interface TopCustomersResponse {
  data: TopCustomerRow[]
  execution_time_ms: number
  cached: boolean
}

export const reportsService = {
  getProfitLoss: async (startDate?: Date, endDate?: Date): Promise<ProfitLossResponse> => {
    const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    
    const response = await api.get<ProfitLossResponse>(`/reports/profit-loss?start_date=${start}&end_date=${end}`)
    return response.data
  },

  getRevenueByCategory: async (startDate?: Date, endDate?: Date): Promise<RevenueByCategoryResponse> => {
    const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    
    const response = await api.get<RevenueByCategoryResponse>(`/reports/revenue-category?start_date=${start}&end_date=${end}`)
    return response.data
  },

  getTopCustomers: async (startDate?: Date, endDate?: Date, limit: number = 10): Promise<TopCustomersResponse> => {
    const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    
    const response = await api.get<TopCustomersResponse>(`/reports/top-customers?start_date=${start}&end_date=${end}&limit=${limit}`)
    return response.data
  },
}

