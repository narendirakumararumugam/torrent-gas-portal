import React from 'react';
import { FileText } from 'lucide-react';
import Card from './common/Card';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function CommercialTermsCardCommercial({ terms }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          <FileText className="h-4.5 w-4.5 text-slate-600" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Commercial &amp; Operational Terms</h2>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Customer Category" value={terms.category} />
        <Field label="Establishment Type" value={terms.establishmentType} />
        <Field label="Daily Avg Volume" value={terms.dailyAverageVolume} />
        <Field label="Peak Hourly Demand" value={terms.peakHourlyDemand} />
        <Field label="Delivery Pressure" value={terms.deliveryPressure} />
        <Field label="Meter Type" value={terms.meterType} />
      </div>
    </Card>
  );
}

export default CommercialTermsCardCommercial;