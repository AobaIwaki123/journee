/**
 * 通貨に関するユーティリティ関数
 */

/**
 * 通貨コードから記号を取得
 */
export function getCurrencySymbol(currency?: string): string {
  const currencySymbols: Record<string, string> = {
    JPY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  
  return currencySymbols[currency || 'JPY'] || '¥';
}

/**
 * 金額を通貨付きでフォーマット
 */
export function formatCurrency(amount: number, currency?: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString()}`;
}
