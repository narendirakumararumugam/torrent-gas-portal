import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatINR, LATE_PAYMENT_INTEREST_RATE } from '../../utils/billingEngine';

const statusToneMap = {
  paid: 'paid',
  paid_late: 'in-progress',
  partially_paid: 'in-progress',
  overdue: 'overdue',
  pending: 'pending',
};

const statusLabelMap = {
  paid: 'Paid',
  paid_late: 'Paid (Late)',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
  pending: 'Pending',
};

function AgingLedgerTable({ ledger }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-blue-950">Aging &amp; Interest Ledger</p>
        <p className="text-xs text-slate-500">Late interest accrues at {LATE_PAYMENT_INTEREST_RATE}% p.a. on unpaid principal</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Billing Cycle</th>
              <th className="px-5 py-3 font-medium">Due Date</th>
              <th className="px-5 py-3 font-medium">Extra Delay</th>
              <th className="px-5 py-3 font-medium">Late Interest</th>
              <th className="px-5 py-3 font-medium">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ledger.map((cycle) => (
              <tr key={cycle.id} className="transition hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{cycle.label}</td>
                <td className="px-5 py-3 text-slate-500">
                  {new Date(cycle.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={cycle.extraDelayDays > 0 ? 'overdue' : 'paid'}>
                    {cycle.extraDelayDays > 0 ? `${cycle.extraDelayDays} day(s) late` : 'On-time'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-slate-800">{cycle.lateInterest > 0 ? formatINR(cycle.lateInterest) : '—'}</td>
                <td className="px-5 py-3">
                  <Badge tone={statusToneMap[cycle.paymentStatus]}>{statusLabelMap[cycle.paymentStatus]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default AgingLedgerTable;
