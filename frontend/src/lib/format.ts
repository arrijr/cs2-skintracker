// /frontend/src/lib/format.ts
// {/* Formatting helpers – no magic numbers, consistent price & date display */}

export function formatPriceUSD(price: number | null | undefined): string {
  if (typeof price !== 'number' || isNaN(price)) return '-';
  return `$${price.toFixed(2)}`;
}

export function formatPercentage(percentage: number | null | undefined): string {
  if (typeof percentage !== 'number' || isNaN(percentage)) return '-';
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US');
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return '-';
  }
}

export function formatQuantity(quantity: number | null | undefined): string {
  if (typeof quantity !== 'number' || isNaN(quantity)) return '-';
  return quantity.toString();
}
