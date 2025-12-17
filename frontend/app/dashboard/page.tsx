'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import Navbar from '@/components/Navbar'
import { authService } from '@/lib/auth'
import { reportsService } from '@/lib/reports'
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

  const { data: profitLoss, isLoading: loadingPL } = useQuery({
    queryKey: ['profitLoss', startDate, endDate],
    queryFn: () => reportsService.getProfitLoss(startDate, endDate),
  })

  const { data: revenueCategory, isLoading: loadingRev } = useQuery({
    queryKey: ['revenueCategory', startDate, endDate],
    queryFn: () => reportsService.getRevenueByCategory(startDate, endDate),
  })

  const { data: topCustomers, isLoading: loadingTop } = useQuery({
    queryKey: ['topCustomers', startDate, endDate],
    queryFn: () => reportsService.getTopCustomers(startDate, endDate, 5),
  })

  if (loadingPL || loadingRev || loadingTop) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Total Revenue
            </h3>
            <p className="text-3xl font-bold text-green-600">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-red-600">
              ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Net Profit
            </h3>
            <p
              className={`text-3xl font-bold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Revenue by Category Chart */}
        {revenueCategory && revenueCategory.data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Revenue by Category</h2>
              <div className="text-sm text-gray-500">
                Generated in {revenueCategory.execution_time_ms}ms
                {revenueCategory.cached && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Cached
                  </span>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueCategory.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue_amount" fill="#0088FE" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Customers */}
        {topCustomers && topCustomers.data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Top Customers</h2>
              <div className="text-sm text-gray-500">
                Generated in {topCustomers.execution_time_ms}ms
                {topCustomers.cached && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Cached
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topCustomers.data.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${customer.total_revenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.transaction_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $
                        {customer.average_transaction.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Profit & Loss Summary</h2>
              <div className="text-sm text-gray-500">
                Generated in {profitLoss.execution_time_ms}ms
                {profitLoss.cached && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Cached
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">Revenue</h3>
                {profitLoss.data
                  .filter((item) => item.category_type === 'revenue')
                  .map((item) => (
                    <div
                      key={item.category_name}
                      className="flex justify-between py-2 border-b"
                    >
                      <span>{item.category_name}</span>
                      <span className="font-medium">
                        ${item.total_amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Expenses</h3>
                {profitLoss.data
                  .filter((item) => item.category_type === 'expense')
                  .map((item) => (
                    <div
                      key={item.category_name}
                      className="flex justify-between py-2 border-b"
                    >
                      <span>{item.category_name}</span>
                      <span className="font-medium">
                        ${item.total_amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

