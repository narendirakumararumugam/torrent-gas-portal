import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Card from '../common/Card';
import { formatINR } from '../../utils/billingEngine';

/* High-priority popup auto-triggered when outstanding exposure exceeds available security */
function DeficitAlertModal({ exposure, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <Card className="w-full max-w-md p-6" role="alertdialog" aria-modal="true" aria-labelledby="deficit-modal-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="h-5 w-5 text-rose-600" aria-hidden="true" />
          </div>
          <button type="button" onClick={onClose} aria-label="Dismiss alert" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <h3 id="deficit-modal-title" className="mt-3 text-lg font-semibold text-blue-950">Payment Security Shortfall</h3>
        <p className="mt-1 text-sm text-slate-500">
          Total outstanding has exceeded the available payment security. Please top up the deposit immediately to avoid supply restriction.
        </p>
        <div className="mt-4 space-y-2 rounded-lg bg-rose-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Total Outstanding</span>
            <span className="font-semibold text-blue-950">{formatINR(exposure.totalOutstanding)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Available Security</span>
            <span className="font-semibold text-blue-950">{formatINR(exposure.availableSecurity)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-rose-200 pt-2">
            <span className="font-semibold text-rose-700">Deficit to Cover</span>
            <span className="text-base font-bold text-rose-700">{formatINR(exposure.deficit)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Acknowledge
        </button>
      </Card>
    </div>
  );
}

export default DeficitAlertModal;
