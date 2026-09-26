import React from 'react';
import { Sparkles } from 'lucide-react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import { tariffSlabs } from '../data/tariffs';

function TariffBoard({ showHeading = true }) {
  return (
    <div className="space-y-6">
      {showHeading && (
        <SectionHeading eyebrow="Pricing" title="Tariff Information" description="Industrial rate slabs divided by pressure and volume tiers." />
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tariffSlabs.map((slab) => (
          <Card key={slab.tier} className="p-5 transition hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{slab.tier}</h3>
                <p className="text-xs text-slate-500">{slab.pressure}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Rate</p>
                <p className="font-semibold text-slate-900">{slab.rate}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Taxes</p>
                <p className="font-medium text-slate-800">{slab.taxes}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Shortfall Penalty</p>
                <p className="font-medium text-slate-800">{slab.penalty}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{slab.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TariffBoard;
