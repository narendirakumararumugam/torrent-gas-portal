import React, { useEffect, useState } from 'react';
import { AlertTriangle, Banknote, Gauge, ShieldCheck } from 'lucide-react';
import Card from './common/Card';
import DeficitAlertModal from './billing/DeficitAlertModal';
import { formatINR } from '../utils/commercialBillingEngine';

function CommercialExposureBanner({ exposure }) {
  const [alertOpen, setAlertOpen] = useState(exposure.isDeficient);

  useEffect(() => {
    setAlertOpen(exposure.isDeficient);
  }, [exposure.isDeficient, exposure.deficit]);

  const metrics = [
    { label: 'Last Fortnight Bill Value (Sep 2nd Fortnight)', value: exposure.lastFortnightBillValue, icon: Banknote, tone: 'text-blue-900' },
    { label: 'Current Unbilled Value', value: exposure.currentUnbilledValue, icon: Gauge, tone: 'text-blue-900' },
    { label: 'Total Outstanding', value: exposure.totalOutstanding, icon: AlertTriangle, tone: exposure.isDeficient ? 'text-rose-600' : 'text-blue-900' },
    { label: 'Available Payment Security', value: exposure.availableSecurity, icon: ShieldCheck, tone: exposure.isDeficient ? 'text-rose-600' : 'text-emerald-600' },
  ];

  return (
    <>
      <Card className={`p-5 ${exposure.isDeficient ? 'border-rose-300 ring-1 ring-rose-200' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Real-Time Exposure</p>
          {exposure.isDeficient && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Security Shortfall: {formatINR(exposure.deficit)}
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.tone}`} aria-hidden="true" />
                <p className="text-xs text-slate-500">{metric.label}</p>
              </div>
              <p className={`mt-2 text-xl font-bold ${metric.tone}`}>{formatINR(metric.value)}</p>
            </div>
          ))}
        </div>
      </Card>

      {alertOpen && exposure.isDeficient && <DeficitAlertModal exposure={exposure} onClose={() => setAlertOpen(false)} />}
    </>
  );
}

export default CommercialExposureBanner;