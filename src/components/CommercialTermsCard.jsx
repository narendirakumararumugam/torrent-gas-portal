import React from 'react';
import { FileText } from 'lucide-react';
import Card from './common/Card';

function Field({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={highlight ? 'mt-1 text-base font-bold text-blue-600' : 'mt-1 text-sm font-medium text-slate-800'}>{value}</p>
    </div>
  );
}

function CommercialTermsCard({ terms }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          <FileText className="h-4.5 w-4.5 text-slate-600" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Commercial & Operational Terms</h2>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Category" value={terms.category} />
        <Field label="Type of Contract" value={terms.contractType} />
        <Field label="DCQ (Daily Contracted Qty)" value={terms.dcq} highlight />
        <Field label="MDCQ (Max Daily Qty)" value={terms.mdcq} highlight />
        <Field label="MGO (Min Guaranteed Offtake)" value={terms.mgo} highlight />
        <Field label="MGO Obligation" value={terms.mgoObligation} />
        <Field label="Excess Limit" value={terms.excessLimit} />
        <Field label="Excess Limit Criteria" value={terms.excessLimitCriteria} />
        <Field label="Meter Type" value={terms.meterType} />
        <Field label="Delivery Pressure" value={terms.deliveryPressure} />
        <Field label="Maximum Allowable Flow Rate" value={terms.maxAllowableFlowRate} />
      </div>
    </Card>
  );
}

export default CommercialTermsCard;
