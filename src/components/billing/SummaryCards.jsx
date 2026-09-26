import React from 'react';
import { CalendarClock, CheckCircle2, Hourglass, TrendingDown } from 'lucide-react';
import Card from '../common/Card';
import { formatINR } from '../../utils/billingEngine';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SummaryCards({ currentBill, receivedPayment, pendingVerification, lateInterest }) {
  const cards = [
    {
      label: 'Last Fortnightly Bill',
      value: formatINR(currentBill.amount),
      detail: `Due ${formatDate(currentBill.dueDate)}`,
      icon: CalendarClock,
      tone: 'text-blue-900',
    },
    {
      label: 'Received Payments',
      value: formatINR(receivedPayment.amount),
      detail: `${receivedPayment.method} · ${formatDate(receivedPayment.clearedDate)}`,
      icon: CheckCircle2,
      tone: 'text-emerald-600',
    },
    {
      label: 'Outstanding Balance',
      value: formatINR(pendingVerification.amount),
      detail: `Pending verification · ${pendingVerification.method}`,
      icon: Hourglass,
      tone: 'text-amber-600',
    },
    {
      label: 'Accrued Late Interest',
      value: formatINR(lateInterest.amount),
      detail: `${lateInterest.rate}% p.a. · ${lateInterest.days} day(s) overdue`,
      icon: TrendingDown,
      tone: lateInterest.amount > 0 ? 'text-rose-600' : 'text-slate-400',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <card.icon className={`h-4.5 w-4.5 ${card.tone}`} aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-950">{card.value}</p>
          <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
        </Card>
      ))}
    </div>
  );
}

export default SummaryCards;
