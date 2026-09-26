import React from 'react';
import { Building2 } from 'lucide-react';
import Card from './common/Card';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function CompanyInfoCard({ company }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          <Building2 className="h-4.5 w-4.5 text-slate-600" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Company Information</h2>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Company Name" value={company.name} />
        <Field label="Registered Office Address" value={company.address} />
        <Field label="Registered Email" value={company.email} />
        <Field label="Registered Phone Number" value={company.phone} />
        <Field label="Agreement Signed Date" value={company.agreementSignedDate} />
        <Field label="Commissioned Date" value={company.commissionedDate} />
      </div>
    </Card>
  );
}

export default CompanyInfoCard;
