export function formatCustomerCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCustomerCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function digitsOnlyPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatCustomerPhone(phone: string): string {
  const digits = digitsOnlyPhone(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone.trim();
}

export function customerPhoneHref(phone: string): string | null {
  const digits = digitsOnlyPhone(phone);
  if (!digits) {
    return null;
  }
  return `tel:${digits}`;
}
