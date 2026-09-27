import React, { useState } from 'react';
import { Download, FolderOpen } from 'lucide-react';
import CompanyInfoCard from './CompanyInfoCard';
import CommercialTermsCard from './CommercialTermsCard';
import ContractHistoryTimeline from './ContractHistoryTimeline';
import SignedLettersPanel from './SignedLettersPanel';
import { contractProfile } from '../data/contractProfile';

function ContractSummary({ onDownload, onShowToast }) {
  const [lettersOpen, setLettersOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Contract Summary</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Verified industrial gas supply agreement details, revisions, and downloadable letters for Torrent Gas portal records.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onDownload(contractProfile.contractNumber)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Signed Contract
          </button>
          <button
            type="button"
            onClick={() => setLettersOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Download Side Letters
          </button>
        </div>
      </div>

      <CompanyInfoCard company={contractProfile.company} />
      <CommercialTermsCard terms={contractProfile.terms} />
      <ContractHistoryTimeline history={contractProfile.history} currentTerms={contractProfile.terms} />

      {lettersOpen && <SignedLettersPanel onClose={() => setLettersOpen(false)} onShowToast={onShowToast} />}
    </div>
  );
}

export default ContractSummary;
