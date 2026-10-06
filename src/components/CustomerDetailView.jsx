import React, { useMemo, useState } from 'react';
import { ArrowLeft, CloudDownload, FileText, History, Users } from 'lucide-react';
import Card from './common/Card';
import CompanyInfoCard from './CompanyInfoCard';
import CommercialTermsCard from './CommercialTermsCard';
import ContractHistoryTimeline from './ContractHistoryTimeline';
import PersonaDashboard from './PersonaDashboard';
import ReportsHub from './ReportsHub';
import SignedLettersPanel from './SignedLettersPanel';
import { contractProfile } from '../data/contractProfile';
import { generateDownload } from '../utils/download';

const tabs = [
  { key: 'summary', label: 'Contract Summary', icon: FileText },
  { key: 'history', label: 'Contract History', icon: History },
  { key: 'reports', label: 'Reports', icon: CloudDownload },
  { key: 'persona', label: 'Persona Dashboard', icon: Users },
];

function formatMoney(value) {
  return `₹ ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildGenericContractSummary(customer) {
  return {
    company: {
      name: customer.name,
      address: customer.address,
      email: customer.email,
      phone: customer.phone,
      agreementSignedDate: customer.startDate,
      commissionedDate: customer.lastInteraction,
    },
    terms: {
      category: customer.type,
      contractType: customer.contractType,
      dcq: `${customer.dcq.toLocaleString()} SCM`,
      mdcq: `${customer.mdcq.toLocaleString()} SCM`,
      mgo: '90%',
      mgoObligation: customer.contractStatus === 'Renewal due' ? 'Monthly' : 'Quarterly',
      excessLimit: '120%',
      excessLimitCriteria: 'Daily',
      meterType: 'G100 RPD',
      deliveryPressure: '4 bar(g)',
      maxAllowableFlowRate: `${customer.peakDaily.toLocaleString()} SCMH`,
    },
    history: [
      {
        id: `${customer.id}-h1`,
        title: 'Original agreement executed',
        status: 'Inception',
        executedOn: customer.startDate,
        effectivePeriod: customer.startDate,
        summary: `Initial supply agreement signed for ${customer.name}.`,
        changes: [
          { label: 'DCQ', before: 'Not set', after: `${customer.dcq.toLocaleString()} SCM/day` },
          { label: 'Contract Type', before: '--', after: customer.contractType },
          { label: 'Tariff', before: '--', after: formatMoney(customer.tariff) + '/SCM' },
        ],
      },
      {
        id: `${customer.id}-h2`,
        title: 'Latest account review',
        status: 'Commercial Review',
        executedOn: customer.lastInteraction,
        effectivePeriod: customer.lastInteraction,
        summary: `Latest operating and billing review for ${customer.name}.`,
        changes: [
          { label: 'Current Consumption', before: 'N/A', after: `${customer.currentConsumption.toLocaleString()} SCM/day` },
          { label: 'Monthly Value', before: 'N/A', after: formatMoney(customer.monthlyValue) },
          { label: 'Payment Status', before: '--', after: customer.paymentStatus },
        ],
      },
      {
        id: `${customer.id}-h3`,
        title: 'Next follow-up scheduled',
        status: 'Follow-up',
        executedOn: customer.nextFollowUp,
        effectivePeriod: customer.nextFollowUp,
        summary: `Planned commercial follow-up with ${customer.accountManager}.`,
        changes: [
          { label: 'Engagement', before: '--', after: customer.engagement },
          { label: 'Growth', before: '--', after: `${customer.growth}%` },
          { label: 'Outstanding', before: '--', after: customer.outstanding > 0 ? formatMoney(customer.outstanding * 100000) : 'Cleared' },
        ],
      },
    ],
  };
}

function buildIndustrialSummary() {
  return {
    company: {
      name: contractProfile.company.name,
      address: contractProfile.company.address,
      email: contractProfile.company.email,
      phone: contractProfile.company.phone,
      agreementSignedDate: contractProfile.company.agreementSignedDate,
      commissionedDate: contractProfile.company.commissionedDate,
    },
    terms: contractProfile.terms,
    history: contractProfile.history,
  };
}

function DetailTabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function PlaceholderTab({ title, customer, description }) {
  const cards = [
    { label: 'Profile', value: customer.name, detail: customer.contractNumber },
    { label: 'Status', value: customer.contractStatus, detail: customer.location },
    { label: 'Consumption', value: `${customer.currentConsumption.toLocaleString()} SCM`, detail: `${customer.mmbtuValue.toFixed(1)} MMBTU @ GCV` },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{title}</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">{customer.name}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CustomerDetailView({ customer, masterGcv, effectiveGcvDate, onBack, onDownloadContract, onShowToast }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [lettersOpen, setLettersOpen] = useState(false);

  const isIndustrialAccount = customer.contractNumber === contractProfile.contractNumber || customer.name === contractProfile.company.name;
  const contractSummary = useMemo(
    () => (isIndustrialAccount ? buildIndustrialSummary() : buildGenericContractSummary(customer)),
    [customer, isIndustrialAccount],
  );

  const reportDownload = (title, format) => {
    const extension = format.toLowerCase();
    const content = format === 'CSV' ? `title\n${title}` : `Report: ${title}\nCNG Custom Self Service Portal`;
    generateDownload(`${title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.${extension}`, content, format === 'CSV' ? 'text/csv' : 'application/pdf');
    if (onShowToast) onShowToast(`${format} export generated for ${title}`);
  };

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to customer list
          </button>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{customer.name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${customer.contractStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'}`}>
              {customer.contractStatus}
            </span>
          </div>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-500">
            {isIndustrialAccount
              ? 'This customer opens the full industrial account experience, including live reports and persona dashboards that mirror the Industrial Customer Login view.'
              : 'This is a corporate demo profile with placeholder data. The full industrial account experience is available for Wheels India.'}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onDownloadContract(customer)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Download Signed Contract
          </button>
          <button
            type="button"
            onClick={() => setLettersOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <CloudDownload className="h-4 w-4" aria-hidden="true" />
            Download Side Letters
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <DetailTabButton key={tab.key} active={activeTab === tab.key} icon={tab.icon} label={tab.label} onClick={() => setActiveTab(tab.key)} />
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Contract Number</p>
              <p className="mt-2 text-xl font-semibold text-blue-950">{customer.contractNumber}</p>
              <p className="mt-1 text-xs text-slate-500">{customer.contractType}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Daily SCM</p>
              <p className="mt-2 text-xl font-semibold text-blue-950">{customer.currentConsumption.toLocaleString()} SCM</p>
              <p className="mt-1 text-xs text-slate-500">Average daily {customer.averageDaily.toLocaleString()} SCM</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Monthly Value</p>
              <p className="mt-2 text-xl font-semibold text-blue-950">{formatMoney(customer.monthlyValue)}</p>
              <p className="mt-1 text-xs text-slate-500">Tariff {formatMoney(customer.tariff)}/SCM</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Outstanding Balance</p>
              <p className="mt-2 text-xl font-semibold text-blue-950">{customer.outstanding > 0 ? `₹ ${customer.outstanding.toFixed(2)}L` : 'Cleared'}</p>
              <p className="mt-1 text-xs text-slate-500">Payment status {customer.paymentStatus}</p>
            </Card>
          </div>

          <CompanyInfoCard company={contractSummary.company} />
          <CommercialTermsCard terms={contractSummary.terms} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Revision log</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">Contract History</h3>
            <p className="mt-1 text-sm text-slate-500">{isIndustrialAccount ? 'Full amendment history from the live industrial account.' : 'Corporate demo history for the selected customer profile.'}</p>
          </Card>
          <ContractHistoryTimeline history={contractSummary.history} currentTerms={contractSummary.terms} />
        </div>
      )}

      {activeTab === 'reports' && (isIndustrialAccount ? <ReportsHub onDownload={reportDownload} onShowToast={onShowToast} audience="customer" /> : <PlaceholderTab title="Reports" customer={customer} description="Placeholder reporting data is shown for demo customer profiles. Select Wheels India to see the live industrial reports experience." />)}

      {activeTab === 'persona' && (isIndustrialAccount ? <PersonaDashboard audience="corporate" /> : <PlaceholderTab title="Persona Dashboard" customer={customer} description="Placeholder persona data is shown for demo customer profiles. Select Wheels India to see the live industrial dashboards experience." />)}

      {lettersOpen && <SignedLettersPanel onClose={() => setLettersOpen(false)} onShowToast={onShowToast} />}
    </div>
  );
}

export default CustomerDetailView;