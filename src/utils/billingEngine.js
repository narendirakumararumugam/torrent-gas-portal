// Industrial-only billing math: fortnightly exposure, aging and late-payment interest.
import { calcLateInterest as calcLateInterestGeneric, daysBetween, formatINR, getInvoiceTotals } from './billingFormat';

export const LATE_PAYMENT_INTEREST_RATE = 15.65; // % per annum, per contract terms
export const STANDARD_GRACE_BUSINESS_DAYS = 5;

export { formatINR, daysBetween, getInvoiceTotals };

export function calcLateInterest(principal, overdueDays, annualRatePercent = LATE_PAYMENT_INTEREST_RATE) {
  return calcLateInterestGeneric(principal, overdueDays, annualRatePercent);
}

/* Derives per-cycle aging: outstanding principal, delay beyond the due date, accrued interest and status */
export function getCycleLedger(cycles, referenceDateISO) {
  return cycles.map((cycle) => {
    const outstanding = Math.max(0, cycle.invoiced - cycle.paid);
    const settledOnOrBeforeDue = outstanding === 0 && cycle.paidDate && daysBetween(cycle.dueDate, cycle.paidDate) <= 0;
    const clearedDate = outstanding === 0 ? cycle.paidDate : null;
    const delayReferenceDate = clearedDate;
    const extraDelayDays = delayReferenceDate ? Math.max(0, daysBetween(cycle.dueDate, delayReferenceDate)) : 0;
    const lateInterest = calcLateInterest(cycle.invoiced, extraDelayDays);
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
  const outstandingBalance = Math.max(0, lastCycle.invoiced - lastCycle.paid);
  const totalOutstanding = currentUnbilledValue + outstandingBalance + 2687;
  const deficit = Math.max(0, totalOutstanding - availableSecurity);

  return {
    lastFortnightBillValue,
    currentUnbilledValue,
    outstandingBalance,
    paymentsReceived,
    totalOutstanding,
    availableSecurity,
    deficit,
    isDeficient: deficit > 0,
  };
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

export { getInvoiceNumber } from './billingFormat';
