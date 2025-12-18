'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import Navbar from '@/components/Navbar'
import { authService } from '@/lib/auth'
import { reportsService } from '@/lib/reports'
import { formatRupiah } from '@/lib/currency'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function ReportsPage() {
  const router = useRouter()
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reportType, setReportType] = useState<'profit-loss' | 'revenue-category' | 'top-customers'>('profit-loss')

  useEffect(() => {
    if (!authService.getToken()) {
      router.push('/login')
    }
  }, [router])

  const { data: profitLoss, isLoading: loadingPL, refetch: refetchPL } = useQuery({
    queryKey: ['profitLoss', startDate, endDate],
    queryFn: () => reportsService.getProfitLoss(new Date(startDate), new Date(endDate)),
    enabled: reportType === 'profit-loss',
  })

  const { data: revenueCategory, isLoading: loadingRev, refetch: refetchRev } = useQuery({
    queryKey: ['revenueCategory', startDate, endDate],
    queryFn: () => reportsService.getRevenueByCategory(new Date(startDate), new Date(endDate)),
    enabled: reportType === 'revenue-category',
  })

  const { data: topCustomers, isLoading: loadingTop, refetch: refetchTop } = useQuery({
    queryKey: ['topCustomers', startDate, endDate],
    queryFn: () => reportsService.getTopCustomers(new Date(startDate), new Date(endDate), 10),
    enabled: reportType === 'top-customers',
  })

  const handleGenerate = () => {
    if (reportType === 'profit-loss') refetchPL()
    if (reportType === 'revenue-category') refetchRev()
    if (reportType === 'top-customers') refetchTop()
  }

  const isLoading = loadingPL || loadingRev || loadingTop

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Financial Reports
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Generate dan analisis laporan keuangan detail
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setReportType(e.target.value as 'profit-loss' | 'revenue-category' | 'top-customers')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 font-medium"
              >
                <option value="profit-loss">Profit & Loss</option>
                <option value="revenue-category">Revenue by Category</option>
                <option value="top-customers">Top Customers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 font-medium"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md transform hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Profit & Loss Report */}
        {reportType === 'profit-loss' && profitLoss && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Profit & Loss Report</h2>
                <p className="text-sm text-slate-500">Detail pendapatan dan pengeluaran</p>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {profitLoss.data.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {item.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            item.category_type === 'revenue'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {item.category_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        item.category_type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatRupiah(item.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.transaction_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue by Category Report */}
        {reportType === 'revenue-category' && revenueCategory && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-8">
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
                  formatter={(value: number) => formatRupiah(value)}
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
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Revenue
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
                  {revenueCategory.data.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {item.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatRupiah(item.revenue_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.transaction_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                        {formatRupiah(item.average_transaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Customers Report */}
        {reportType === 'top-customers' && topCustomers && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/50 p-8">
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
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={topCustomers.data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="customer_name" 
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
                  formatter={(value: number) => formatRupiah(value)}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="total_revenue" 
                  fill="url(#customerGradient)" 
                  name="Revenue (Rp)"
                  radius={[8, 8, 0, 0]}
                  stroke="#059669"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 overflow-x-auto">
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
                  {topCustomers.data.map((customer: any, index: number) => (
                    <tr key={customer.customer_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
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
      </div>
    </div>
  )
}

