import React from 'react';
import Card from '../common/Card';

/* Slab totals + tariff-tier labels for the Price Slab consumption report */
function PriceSlabSummaryCards({ tiers }) {
  const toneByKey = {
    mgo: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', value: 'text-emerald-700' },
    nonMgo: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20', value: 'text-amber-700' },
    excess: { chip: 'bg-rose-50 text-rose-700 ring-rose-600/20', value: 'text-rose-700' },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiers.map((tier) => {
        const tone = toneByKey[tier.key] || toneByKey.mgo;
        return (
          <Card key={tier.key} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-blue-950">{tier.label}</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tone.chip}`}>{tier.tariffLabel}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{tier.range}</p>
            <p className={`mt-3 text-2xl font-bold ${tone.value}`}>{tier.total.toFixed(2)} MMBTU</p>
          </Card>
        );
      })}
    </div>
  );
}

export default PriceSlabSummaryCards;
