// Generic currency/invoice-math helpers shared by both the industrial and commercial billing engines.
// Contains no customer- or persona-specific data so billing/*.jsx components can stay engine-agnostic.

export function formatINR(amount) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export function toUTCDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

export function daysBetween(fromISO, toISO) {
  if (!fromISO || !toISO) return 0;
  return Math.round((toUTCDate(toISO) - toUTCDate(fromISO)) / 86400000);
}

/* Simple-interest accrual on an unpaid principal, per contract's annual rate */
export function calcLateInterest(principal, overdueDays, annualRatePercent) {
  if (principal <= 0 || overdueDays <= 0) return 0;
  return (principal * (annualRatePercent / 100) * overdueDays) / 365;
}

export function getInvoiceTotals(invoiceBreakdown) {
  const subtotal = invoiceBreakdown.rows.reduce((sum, row) => sum + row.amount, 0);
  const vat = subtotal * invoiceBreakdown.vatRate;
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

export function getInvoiceNumber(cycle) {
  return `TGL/${cycle.invoicedDate.slice(0, 4)}/${cycle.id}`;
}
