/**
 * Format number as Indonesian Rupiah currency
 * @param amount - The amount to format
 * @returns Formatted string like "Rp 1.234.567,89"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number as Indonesian Rupiah currency with decimals
 * @param amount - The amount to format
 * @returns Formatted string like "Rp 1.234.567,89"
 */
export function formatRupiahWithDecimals(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

