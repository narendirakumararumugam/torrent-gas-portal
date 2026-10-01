import React from 'react';
import { Download } from 'lucide-react';
import CompanyInfoCard from './CompanyInfoCard';
import ContractHistoryTimeline from './ContractHistoryTimeline';
import CommercialTermsCardCommercial from './CommercialTermsCardCommercial';
import { commercialContractProfile } from '../data/commercialContractProfile';

function CommercialContractSummary({ onDownload }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Commercial Contract Summary</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Flat-rate commercial supply details for hospitality and restaurant customers.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onDownload(commercialContractProfile.contractNumber)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Signed Contract
          </button>
        </div>
      </div>

      <CompanyInfoCard company={commercialContractProfile.company} />
      <CommercialTermsCardCommercial terms={commercialContractProfile.terms} />
      <ContractHistoryTimeline history={commercialContractProfile.history} currentTerms={commercialContractProfile.terms} />
    </div>
  );
}

export default CommercialContractSummary;