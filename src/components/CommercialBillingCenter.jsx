import React from 'react';
import BillsHeader from './billing/BillsHeader';
import CommercialExposureBanner from './CommercialExposureBanner';
import SummaryCards from './billing/SummaryCards';
import BillingHistoryChart from './billing/BillingHistoryChart';
import InvoiceBreakdownTable from './billing/InvoiceBreakdownTable';
import PaymentDelayChart from './billing/PaymentDelayChart';
import AgingLedgerTable from './billing/AgingLedgerTable';
import {
  billingCustomer,
  billingCycles,
  currentUnbilledCycle,
  lastClearedPayment,
  pendingVerificationPayment,
  availablePaymentSecurity,
  currentInvoiceBreakdown,
  supplierProfile,
  BILLING_REFERENCE_DATE,
} from '../data/commercialBillsPayments';
import { getCycleLedger, getExposureSummary, resolveInvoiceBreakdown, LATE_PAYMENT_INTEREST_RATE } from '../utils/commercialBillingEngine';
import { generateTaxInvoicePdf } from '../utils/invoicePdf';
import { exportTableCsv } from '../utils/csvExport';

const invoiceCycleOptions = [...billingCycles].reverse().map((cycle) => ({
  ...cycle,
  monthLabel: new Date(cycle.invoicedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
}));

function CommercialBillingCenter({ onShowToast }) {
  const ledger = getCycleLedger(billingCycles, BILLING_REFERENCE_DATE);
  const lastCycle = billingCycles[billingCycles.length - 1];
  const exposure = getExposureSummary({ lastCycle, unbilledCycle: currentUnbilledCycle, availableSecurity: availablePaymentSecurity });

  const overdueCycle = ledger.find((cycle) => cycle.outstanding > 0);
  const lateInterest = overdueCycle
    ? { amount: overdueCycle.lateInterest, days: overdueCycle.extraDelayDays, rate: LATE_PAYMENT_INTEREST_RATE }
    : { amount: 0, days: 0, rate: LATE_PAYMENT_INTEREST_RATE };

  const handleSelectInvoiceCycle = (cycleId) => {
    const cycle = billingCycles.find((item) => item.id === cycleId);
    if (!cycle) return;
    const invoiceBreakdown = resolveInvoiceBreakdown(cycle, currentInvoiceBreakdown);
    generateTaxInvoicePdf({ cycle, invoiceBreakdown, customer: billingCustomer, supplier: supplierProfile });
    onShowToast(`Tax invoice generated for ${cycle.label}`);
  };

  const handleGenerateLedger = (from, to) => {
    const rows = ledger
      .filter((cycle) => cycle.dueDate >= from && cycle.dueDate <= to)
      .map((cycle) => [cycle.label, cycle.dueDate, cycle.extraDelayDays, cycle.lateInterest.toFixed(2), cycle.paymentStatus]);
    exportTableCsv('ledger-statement.csv', ['Billing Cycle', 'Due Date', 'Extra Delay (days)', 'Late Interest (₹)', 'Payment Status'], rows);
    onShowToast(`Ledger statement generated for ${from} to ${to}`);
  };

  return (
    <div className="space-y-6">
      <BillsHeader
        customerName={billingCustomer.name}
        customerLocation={billingCustomer.location}
        invoiceCycles={invoiceCycleOptions}
        onSelectInvoiceCycle={handleSelectInvoiceCycle}
        onGenerateLedger={handleGenerateLedger}
      />

      <CommercialExposureBanner exposure={exposure} />

      <SummaryCards
        currentBill={{ amount: lastCycle.invoiced, dueDate: lastCycle.dueDate }}
        receivedPayment={lastClearedPayment}
        pendingVerification={pendingVerificationPayment}
        lateInterest={lateInterest}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <BillingHistoryChart cycles={billingCycles} />
        <InvoiceBreakdownTable invoiceBreakdown={currentInvoiceBreakdown} cycleLabel={lastCycle.label} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PaymentDelayChart ledger={ledger} />
        <AgingLedgerTable ledger={ledger} interestRate={LATE_PAYMENT_INTEREST_RATE} />
      </div>
    </div>
  );
}

export default CommercialBillingCenter;