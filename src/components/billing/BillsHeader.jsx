import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import InvoiceCycleMenu from './InvoiceCycleMenu';

function BillsHeader({ customerName, customerLocation, invoiceCycles, onSelectInvoiceCycle, onGenerateLedger }) {
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState('2026-09-23');

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
          Fortnightly PNG Billing, Payment Delays &amp; Late Interest
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-blue-950">Bills &amp; Payments</h2>
        <p className="mt-1 text-sm text-slate-500">
          Customer: <span className="font-medium text-blue-900">{customerName}</span> ({customerLocation})
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InvoiceCycleMenu cycles={invoiceCycles} onSelect={onSelectInvoiceCycle} />

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
            aria-label="Ledger start date"
            className="w-32 rounded-md border-0 bg-transparent px-1.5 py-1 text-xs text-slate-700 outline-none"
          />
          <span className="text-xs text-slate-300">to</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
            aria-label="Ledger end date"
            className="w-32 rounded-md border-0 bg-transparent px-1.5 py-1 text-xs text-slate-700 outline-none"
          />
          <button
            type="button"
            onClick={() => onGenerateLedger(from, to)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            Generate Ledger Statement
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillsHeader;
