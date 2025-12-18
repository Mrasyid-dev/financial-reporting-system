'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import Navbar from '@/components/Navbar'
import { authService } from '@/lib/auth'
import { reportsService } from '@/lib/reports'
import { formatRupiah, formatRupiahWithDecimals } from '@/lib/currency'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function DashboardPage() {
  const router = useRouter()
  const user = authService.getUser()

  useEffect(() => {
    if (!authService.getToken()) {
      router.push('/login')
    }
  }, [router])

  const endDate = new Date()
  const startDate = subDays(endDate, 30)
  
  // Format dates as strings for stable query keys
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  const { data: profitLoss, isLoading: loadingPL, error: errorPL } = useQuery({
    queryKey: ['profitLoss', startDateStr, endDateStr],
    queryFn: () => reportsService.getProfitLoss(startDate, endDate),
    enabled: true, // Explicitly enable the query
  })

  const { data: revenueCategory, isLoading: loadingRev, error: errorRev } = useQuery({
    queryKey: ['revenueCategory', startDateStr, endDateStr],
    queryFn: () => reportsService.getRevenueByCategory(startDate, endDate),
    enabled: true,
  })

  const { data: topCustomers, isLoading: loadingTop, error: errorTop } = useQuery({
    queryKey: ['topCustomers', startDateStr, endDateStr],
    queryFn: () => reportsService.getTopCustomers(startDate, endDate, 5),
    enabled: true,
  })

  const isLoading = loadingPL || loadingRev || loadingTop
  const hasError = errorPL || errorRev || errorTop

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-slate-600 font-medium text-lg">Memuat laporan...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-soft">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold text-lg mb-2">Error loading reports</h3>
                <p className="text-sm mb-2">
                  {errorPL && `Profit Loss: ${errorPL instanceof Error ? errorPL.message : 'Unknown error'}`}
                  {errorRev && `Revenue Category: ${errorRev instanceof Error ? errorRev.message : 'Unknown error'}`}
                  {errorTop && `Top Customers: ${errorTop instanceof Error ? errorTop.message : 'Unknown error'}`}
                </p>
                <p className="text-sm">
                  Please check if the database has been initialized with seed data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalRevenue =
    profitLoss?.data
      .filter((item) => item.category_type === 'revenue')
      .reduce((sum, item) => sum + item.total_amount, 0) || 0

  const totalExpenses =
    profitLoss?.data
      .filter((item) => item.category_type === 'expense')
      .reduce((sum, item) => sum + item.total_amount, 0) || 0

  const netProfit = totalRevenue - totalExpenses

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Dashboard Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Overview keuangan dan performa bisnis Anda
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl shadow-soft border border-emerald-200/50 p-6 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-600 text-sm font-semibold uppercase tracking-wide">
                Total Revenue
              </h3>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-emerald-700 mb-1">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="text-xs text-emerald-600 font-medium">Pendapatan total</p>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-red-100 rounded-xl shadow-soft border border-rose-200/50 p-6 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-600 text-sm font-semibold uppercase tracking-wide">
                Total Expenses
              </h3>
              <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-rose-700 mb-1">
              {formatRupiah(totalExpenses)}
            </p>
            <p className="text-xs text-rose-600 font-medium">Pengeluaran total</p>
          </div>
          
          <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-50 to-green-100 border-emerald-200/50' : 'from-rose-50 to-red-100 border-rose-200/50'} rounded-xl shadow-soft border p-6 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-600 text-sm font-semibold uppercase tracking-wide">
                Net Profit
              </h3>
              <div className={`w-12 h-12 bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-400 to-green-500' : 'from-rose-400 to-red-500'} rounded-lg flex items-center justify-center shadow-md`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-bold mb-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatRupiah(netProfit)}
            </p>
            <p className={`text-xs font-medium ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netProfit >= 0 ? 'Laba bersih' : 'Rugi bersih'}
            </p>
          </div>
        </div>

        {/* Revenue by Category Chart */}
        {revenueCategory && revenueCategory.data.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Revenue by Category</h2>
                <p className="text-sm text-slate-500">Distribusi pendapatan berdasarkan kategori</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">Performance</div>
                <div className="text-sm font-semibold text-slate-700">
                  {revenueCategory.execution_time_ms}ms
                </div>
                {revenueCategory.cached && (
                  <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                    ✓ Cached
                  </span>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={revenueCategory.data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="category_name" 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value: number) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px',
                  }}
                  formatter={(value: any) => formatRupiah(value)}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="revenue_amount" 
                  fill="url(#revenueGradient)" 
                  name="Revenue (Rp)"
                  radius={[8, 8, 0, 0]}
                  stroke="#2563eb"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Customers */}
        {topCustomers && topCustomers.data.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Top Customers</h2>
                <p className="text-sm text-slate-500">Pelanggan teratas berdasarkan revenue</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">Performance</div>
                <div className="text-sm font-semibold text-slate-700">
                  {topCustomers.execution_time_ms}ms
                </div>
                {topCustomers.cached && (
                  <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                    ✓ Cached
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Avg Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {topCustomers.data.map((customer, index) => (
                    <tr key={customer.customer_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                            {index + 1}
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {customer.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatRupiah(customer.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.transaction_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                        {formatRupiah(customer.average_transaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profit & Loss Summary */}
        {profitLoss && profitLoss.data.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Profit & Loss Summary</h2>
                <p className="text-sm text-slate-500">Ringkasan pendapatan dan pengeluaran</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">Performance</div>
                <div className="text-sm font-semibold text-slate-700">
                  {profitLoss.execution_time_ms}ms
                </div>
                {profitLoss.cached && (
                  <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                    ✓ Cached
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200/50">
                <h3 className="font-bold mb-4 text-emerald-700 text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Revenue
                </h3>
                <div className="space-y-3">
                  {profitLoss.data
                    .filter((item) => item.category_type === 'revenue')
                    .map((item) => (
                      <div
                        key={item.category_name}
                        className="flex justify-between items-center py-2 border-b border-emerald-200/50 last:border-0"
                      >
                        <span className="text-slate-700 font-medium">{item.category_name}</span>
                        <span className="font-bold text-emerald-600">
                          {formatRupiah(item.total_amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-lg p-6 border border-rose-200/50">
                <h3 className="font-bold mb-4 text-rose-700 text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  Expenses
                </h3>
                <div className="space-y-3">
                  {profitLoss.data
                    .filter((item) => item.category_type === 'expense')
                    .map((item) => (
                      <div
                        key={item.category_name}
                        className="flex justify-between items-center py-2 border-b border-rose-200/50 last:border-0"
                      >
                        <span className="text-slate-700 font-medium">{item.category_name}</span>
                        <span className="font-bold text-rose-600">
                          {formatRupiah(item.total_amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

