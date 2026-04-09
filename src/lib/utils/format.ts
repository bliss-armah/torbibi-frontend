/**
 * Format pesewas to a human-readable GHS string.
 * e.g. 5000 → "GHS 50.00"
 */
export function formatPrice(pesewas: number, currency = 'GHS'): string {
  return `${currency} ${(pesewas / 100).toFixed(2)}`;
}

export function formatPhoneDisplay(phone: string): string {
  // Normalize +233XXXXXXXXX → 0XXXXXXXXX for display
  return phone.startsWith('+233') ? '0' + phone.slice(4) : phone;
}

export function formatOrderStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Truncate text for preview cards */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
