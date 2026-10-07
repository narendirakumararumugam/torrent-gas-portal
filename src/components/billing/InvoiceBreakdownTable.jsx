import React from 'react';
import Card from '../common/Card';
import { formatINR, getInvoiceTotals } from '../../utils/billingFormat';

function InvoiceBreakdownTable({
  invoiceBreakdown,
  cycleLabel,
  title = 'Current Invoice Breakdown',
  subtitle = 'Billing cycle',
  subtotalLabel = 'Subtotal',
  vatLabel = 'Statutory Levies & VAT (5%)',
  totalLabel = 'Total Invoice Payable',
}) {
  const { subtotal, vat, total } = getInvoiceTotals(invoiceBreakdown);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-blue-950">{title}</p>
        <p className="text-xs text-slate-500">{subtitle} {cycleLabel}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Component</th>
              <th className="px-5 py-3 font-medium">Quantity</th>
              <th className="px-5 py-3 font-medium">Rate</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoiceBreakdown.rows.map((row) => (
              <tr key={row.label}>
                <td className="px-5 py-3 font-medium text-slate-800">{row.label}</td>
                <td className="px-5 py-3 text-slate-500">{row.qty}</td>
                <td className="px-5 py-3 text-slate-500">{row.rate}</td>
                <td className="px-5 py-3 text-right text-slate-800">{formatINR(row.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="px-5 py-3 font-medium text-slate-600" colSpan={3}>{subtotalLabel}</td>
              <td className="px-5 py-3 text-right text-slate-700">{formatINR(subtotal)}</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-medium text-slate-800" colSpan={3}>{vatLabel}</td>
              <td className="px-5 py-3 text-right text-slate-800">{formatINR(vat)}</td>
            </tr>
            <tr className="bg-blue-50/60">
              <td className="px-5 py-3 font-semibold text-blue-950" colSpan={3}>{totalLabel}</td>
              <td className="px-5 py-3 text-right text-base font-bold text-blue-950">{formatINR(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default InvoiceBreakdownTable;
