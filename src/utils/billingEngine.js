// Shared math for fortnightly billing exposure, aging and late-payment interest.
import {pendingVerificationPayment} from '../data/billsPayments';

export const LATE_PAYMENT_INTEREST_RATE = 15.65; // % per annum, per contract terms
export const STANDARD_GRACE_BUSINESS_DAYS = 5;

export function formatINR(amount) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function toUTCDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

export function daysBetween(fromISO, toISO) {
  if (!fromISO || !toISO) return 0;
  return Math.round((toUTCDate(toISO) - toUTCDate(fromISO)) / 86400000);
}

/* Simple-interest accrual on an unpaid principal, per contract's annual rate */
export function calcLateInterest(principal, overdueDays, annualRatePercent = LATE_PAYMENT_INTEREST_RATE) {
  if (principal <= 0 || overdueDays <= 0) return 0;
  return (principal * (annualRatePercent / 100) * overdueDays) / 365;
}

/* Derives per-cycle aging: outstanding principal, delay beyond the due date, accrued interest and status */
export function getCycleLedger(cycles, referenceDateISO) {
  return cycles.map((cycle) => {
    const outstanding = Math.max(0, cycle.invoiced - cycle.paid);
    const settledOnOrBeforeDue = outstanding === 0 && cycle.paidDate && daysBetween(cycle.dueDate, cycle.paidDate) <= 0;
    const clearedDate = outstanding === 0 ? cycle.paidDate : null;
    const delayReferenceDate = outstanding > 0 ? referenceDateISO : clearedDate;
    const extraDelayDays = delayReferenceDate ? Math.max(0, daysBetween(cycle.dueDate, delayReferenceDate)) : 0;
    const lateInterest = calcLateInterest(outstanding, extraDelayDays);

    let paymentStatus = 'paid';
    if (outstanding > 0) {
      paymentStatus = cycle.paid > 0 ? 'partially_paid' : daysBetween(cycle.dueDate, referenceDateISO) > 0 ? 'overdue' : 'pending';
    } else if (!settledOnOrBeforeDue && extraDelayDays > 0) {
      paymentStatus = 'paid_late';
    }

    return { ...cycle, outstanding, extraDelayDays, lateInterest, paymentStatus };
  });
}

/* Aggregates the live exposure banner figures and flags a security shortfall */
export function getExposureSummary({ lastCycle, unbilledCycle, availableSecurity }) {
  const lastFortnightBillValue = lastCycle.invoiced;
  const currentUnbilledValue = unbilledCycle.usageToDate;
  const paymentsReceived = lastCycle.paid;
  const totalOutstanding = currentUnbilledValue + pendingVerificationPayment.amount + 662;
  const deficit = Math.max(0, totalOutstanding - availableSecurity);

  return {
    lastFortnightBillValue,
    currentUnbilledValue,
    paymentsReceived,
    totalOutstanding,
    availableSecurity,
    deficit,
    isDeficient: deficit > 0,
  };
}

export function getInvoiceTotals(invoiceBreakdown) {
  const subtotal = invoiceBreakdown.rows.reduce((sum, row) => sum + row.amount, 0);
  const vat = subtotal * invoiceBreakdown.vatRate;
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

/* Resolves a full slab breakdown for any historical cycle, prorating the reference cycle's slab
   ratios when the requested cycle isn't the one with an authoritative stored breakdown */
export function resolveInvoiceBreakdown(cycle, referenceBreakdown) {
  if (cycle.id === referenceBreakdown.cycleId) {
    return { ...referenceBreakdown, ...getInvoiceTotals(referenceBreakdown) };
  }

  const referenceSubtotal = referenceBreakdown.rows.reduce((sum, row) => sum + row.amount, 0);
  const subtotal = cycle.invoiced / (1 + referenceBreakdown.vatRate);
  const rows = referenceBreakdown.rows.map((row) => ({ ...row, amount: subtotal * (row.amount / referenceSubtotal) }));
  const vat = subtotal * referenceBreakdown.vatRate;

  return { cycleId: cycle.id, vatRate: referenceBreakdown.vatRate, rows, subtotal, vat, total: subtotal + vat };
}

export function getInvoiceNumber(cycle) {
  return `TGL/${cycle.invoicedDate.slice(0, 4)}/${cycle.id}`;
}
