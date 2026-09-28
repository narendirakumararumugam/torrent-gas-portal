import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Download, Filter, Layers, Mail, Search, Send, Sparkles, TrendingUp, Users } from 'lucide-react';
import Card from '../common/Card';
import SectionHeading from '../common/SectionHeading';
import { tariffRecords } from '../../data/tariffRecords';
import { CUSTOMERS } from '../../data/existing-customers.data.js';
import { generateDownload } from '../../utils/download';

const INITIAL_MASTER_TARIFF = {
  mgo: 45.6,
  nonMgo: 48.9,
  excess: 54.75,
  effectiveFrom: '2026-04-01',
};

function formatPrice(value) {
  return `₹ ${Number(value).toFixed(2)} / SCM`;
}

function buildRevisionGroups(records) {
  const grouped = records.reduce((accumulator, record) => {
    if (!accumulator[record.effectiveDate]) accumulator[record.effectiveDate] = [];
    accumulator[record.effectiveDate].push(record);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .sort(([leftDate], [rightDate]) => (leftDate < rightDate ? 1 : -1))
    .map(([effectiveDate, rows]) => ({
      effectiveDate,
      rows,
      averageRate: (rows.reduce((sum, row) => sum + row.pricePerUnit, 0) / rows.length).toFixed(2),
    }));
}

function buildCustomerProfiles() {
  return CUSTOMERS.slice(0, 12).map((customer, index) => {
    const pricingType = index % 3 === 0 ? 'Master' : 'Custom';
    return {
      customerId: customer.id,
      customerName: customer.name,
      contractNumber: customer.contractNumber,
      industry: customer.industry,
      location: customer.location,
      email: customer.email,
      pricingType,
      emailEnabled: index % 2 === 0,
      emailStatus: index % 2 === 0 ? 'Sent' : 'Not Enabled',
      customPrices:
        pricingType === 'Custom'
          ? {
              mgo: Number((INITIAL_MASTER_TARIFF.mgo + 0.35 + index * 0.12).toFixed(2)),
              nonMgo: Number((INITIAL_MASTER_TARIFF.nonMgo + 0.55 + index * 0.14).toFixed(2)),
              excess: Number((INITIAL_MASTER_TARIFF.excess + 0.85 + index * 0.16).toFixed(2)),
            }
          : null,
      nextAction: index % 2 === 0 ? 'Sent' : 'Pending review',
    };
  });
}

function getEffectivePrices(profile, masterTariff) {
  if (profile.pricingType === 'Custom' && profile.customPrices) return profile.customPrices;
  return {
    mgo: masterTariff.mgo,
    nonMgo: masterTariff.nonMgo,
    excess: masterTariff.excess,
  };
}

function getExposureBadge(pricingType) {
  return pricingType === 'Master'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-800';
}

function MarketingTariffRevision({ onShowToast }) {
  const showToast = onShowToast ?? (() => {});
  const baseRevisions = useMemo(() => buildRevisionGroups(tariffRecords), []);
  const [revisions, setRevisions] = useState(baseRevisions);
  const [masterTariff, setMasterTariff] = useState(INITIAL_MASTER_TARIFF);
  const [profiles, setProfiles] = useState(() => buildCustomerProfiles());
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingFilter, setPricingFilter] = useState('All');
  const [emailFilter, setEmailFilter] = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedPricingType, setSelectedPricingType] = useState('Master');
  const [custEditMgo, setCustEditMgo] = useState('');
  const [custEditNonMgo, setCustEditNonMgo] = useState('');
  const [custEditExcess, setCustEditExcess] = useState('');
  const [customRemarks, setCustomRemarks] = useState(
    'Please note that the revised tariff will be applicable from the specified effective date. Kindly take note of the updated pricing for your monthly consumption.',
  );

  const selectedCustomer = useMemo(
    () => profiles.find((profile) => profile.customerId === selectedCustomerId) ?? null,
    [profiles, selectedCustomerId],
  );

  const latestRevision = revisions[0];
  const distinctSlabCount = useMemo(() => new Set(tariffRecords.map((record) => record.slab)).size, []);

  const summary = useMemo(() => {
    const masterCount = profiles.filter((profile) => profile.pricingType === 'Master').length;
    const customCount = profiles.filter((profile) => profile.pricingType === 'Custom').length;
    const enabledCount = profiles.filter((profile) => profile.emailEnabled).length;
    const avgMasterRate = latestRevision ? latestRevision.averageRate : '0.00';

    return {
      masterCount,
      customCount,
      enabledCount,
      revisionCycles: revisions.length,
      avgMasterRate,
    };
  }, [latestRevision, profiles, revisions.length]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchPricing = pricingFilter === 'All' || profile.pricingType === pricingFilter;
      const matchEmail =
        emailFilter === 'All' ||
        (emailFilter === 'Enabled' && profile.emailEnabled) ||
        (emailFilter === 'Disabled' && !profile.emailEnabled);
      const matchSearch =
        !query ||
        [profile.customerName, profile.customerId, profile.contractNumber, profile.industry, profile.location, profile.email].some((value) =>
          value.toLowerCase().includes(query),
        );
      return matchPricing && matchEmail && matchSearch;
    });
  }, [emailFilter, pricingFilter, profiles, searchQuery]);

  useEffect(() => {
    if (!selectedCustomer) return;

    setSelectedPricingType(selectedCustomer.pricingType);
    setCustEditMgo(selectedCustomer.customPrices?.mgo ?? '');
    setCustEditNonMgo(selectedCustomer.customPrices?.nonMgo ?? '');
    setCustEditExcess(selectedCustomer.customPrices?.excess ?? '');
    setIsPreviewMode(false);
  }, [selectedCustomer]);

  const exportRevisionNote = () => {
    const content = [
      'Marketing Tariff & Price Revision Note',
      `Latest effective date: ${latestRevision?.effectiveDate ?? masterTariff.effectiveFrom}`,
      '',
      `Master MGO: ${formatPrice(masterTariff.mgo)}`,
      `Master NON-MGO: ${formatPrice(masterTariff.nonMgo)}`,
      `Master Excess: ${formatPrice(masterTariff.excess)}`,
      '',
      ...revisions.flatMap((revision) => [
        `Effective date: ${revision.effectiveDate}`,
        ...revision.rows.map((row) => `${row.slab}: INR ${row.pricePerUnit} / SCM`),
        '',
      ]),
    ].join('\n');

    generateDownload('marketing_tariff_revision_note.txt', content, 'text/plain');
    showToast('Tariff revision note downloaded');
  };

  const applyMasterTariff = () => {
    const nextMaster = {
      mgo: Number(masterTariff.mgo),
      nonMgo: Number(masterTariff.nonMgo),
      excess: Number(masterTariff.excess),
      effectiveFrom: masterTariff.effectiveFrom,
    };

    setMasterTariff(nextMaster);
    setRevisions((current) => [
      {
        effectiveDate: nextMaster.effectiveFrom,
        rows: [
          { effectiveDate: nextMaster.effectiveFrom, slab: 'MGO', pricePerUnit: nextMaster.mgo },
          { effectiveDate: nextMaster.effectiveFrom, slab: 'Non-MGO', pricePerUnit: nextMaster.nonMgo },
          { effectiveDate: nextMaster.effectiveFrom, slab: 'Excess', pricePerUnit: nextMaster.excess },
        ],
        averageRate: ((nextMaster.mgo + nextMaster.nonMgo + nextMaster.excess) / 3).toFixed(2),
      },
      ...current.filter((revision) => revision.effectiveDate !== nextMaster.effectiveFrom),
    ]);
    showToast(`Master tariff updated effective ${nextMaster.effectiveFrom}`);
  };

  const sendAllEnabled = () => {
    const enabledIds = profiles.filter((profile) => profile.emailEnabled).map((profile) => profile.customerId);

    if (enabledIds.length === 0) {
      showToast('No customers have email communication enabled.');
      return;
    }

    setProfiles((current) => current.map((profile) => (profile.emailEnabled ? { ...profile, emailStatus: 'Sent', nextAction: 'Email circulated' } : profile)));
    showToast(`Monthly tariffs successfully circulated to ${enabledIds.length} customers.`);
  };

  const selectCustomer = (customerId) => setSelectedCustomerId(customerId);

  const backToList = () => {
    setSelectedCustomerId(null);
    setIsPreviewMode(false);
  };

  const saveCustomerOverride = () => {
    if (!selectedCustomer) return;

    const customPrices =
      selectedPricingType === 'Custom'
        ? {
            mgo: custEditMgo === '' ? null : Number(custEditMgo),
            nonMgo: custEditNonMgo === '' ? null : Number(custEditNonMgo),
            excess: custEditExcess === '' ? null : Number(custEditExcess),
          }
        : null;

    setProfiles((current) =>
      current.map((profile) =>
        profile.customerId === selectedCustomer.customerId
          ? {
              ...profile,
              pricingType: selectedPricingType,
              customPrices,
              emailStatus: profile.emailEnabled ? 'Sent' : 'Not Enabled',
              nextAction: selectedPricingType === 'Custom' ? 'Custom pricing saved' : 'Reset to master pricing',
            }
          : profile,
      ),
    );
    showToast('Customer pricing preference saved successfully.');
  };

  const resetCustomerToMaster = () => {
    if (!selectedCustomer) return;
    if (!window.confirm(`Reset ${selectedCustomer.customerName} to Master Price?`)) return;

    setProfiles((current) =>
      current.map((profile) =>
        profile.customerId === selectedCustomer.customerId
          ? {
              ...profile,
              pricingType: 'Master',
              customPrices: null,
              nextAction: 'Reset to master pricing',
            }
          : profile,
      ),
    );
    setSelectedPricingType('Master');
    showToast('Customer successfully reset to Master Tariff.');
  };

  const toggleEmailSwitch = (profile, checked) => {
    setProfiles((current) =>
      current.map((item) =>
        item.customerId === profile.customerId
          ? { ...item, emailEnabled: checked, emailStatus: checked ? 'Sent' : 'Not Enabled', nextAction: checked ? 'Email enabled' : 'Email disabled' }
          : item,
      ),
    );
  };

  const sendEmailForSelected = () => {
    if (!selectedCustomer) return;
    if (!selectedCustomer.emailEnabled) {
      showToast('Enable email before sending the tariff revision.');
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.customerId === selectedCustomer.customerId ? { ...profile, emailStatus: 'Sent', nextAction: 'Email circulated' } : profile,
      ),
    );
    showToast(`Tariff email successfully sent to ${selectedCustomer.customerName} (${selectedCustomer.email})!`);
    setIsPreviewMode(false);
  };

  const effectivePrices = selectedCustomer ? getEffectivePrices(selectedCustomer, masterTariff) : null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Tariff & Price Revision"
        description="Manage master pricing, customer overrides, and tariff circulation for industrial marketing accounts."
        action={
          <button
            type="button"
            onClick={exportRevisionNote}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Download revision note
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Customers using Master', summary.masterCount, <Users className="h-5 w-5 text-sky-600" />],
          ['Custom priced', summary.customCount, <Sparkles className="h-5 w-5 text-violet-600" />],
          ['Email enabled', summary.enabledCount, <Mail className="h-5 w-5 text-emerald-600" />],
          ['Revision cycles', summary.revisionCycles, <Layers className="h-5 w-5 text-amber-600" />],
        ].map(([label, value, icon]) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">{icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {!selectedCustomer && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Current Master Tariff</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{summary.masterCount} master</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{summary.customCount} custom</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">Standard Industrial Pricing Schedule</h3>
                <p className="mt-1 text-sm text-slate-500">Master tariff inputs used for default customers and the baseline for customer-specific exceptions.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={sendAllEnabled} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <Send className="h-4 w-4" />
                  Send Monthly Email to All Enabled
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block text-sm font-medium text-slate-700">
                MGO (₹ / SCM)
                <input
                  type="number"
                  value={masterTariff.mgo}
                  onChange={(event) => setMasterTariff((current) => ({ ...current, mgo: Number(event.target.value) }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                NON-MGO (₹ / SCM)
                <input
                  type="number"
                  value={masterTariff.nonMgo}
                  onChange={(event) => setMasterTariff((current) => ({ ...current, nonMgo: Number(event.target.value) }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Excess (₹ / SCM)
                <input
                  type="number"
                  value={masterTariff.excess}
                  onChange={(event) => setMasterTariff((current) => ({ ...current, excess: Number(event.target.value) }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Effective From Date
                <input
                  type="text"
                  value={masterTariff.effectiveFrom}
                  onChange={(event) => setMasterTariff((current) => ({ ...current, effectiveFrom: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={applyMasterTariff}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Apply Master Price
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Customer Pricing Registry</h3>
                <p className="mt-1 text-sm text-slate-500">Search customers, filter by pricing source, and review email state before sending the revision.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">MGO | NON-MGO | Excess Structure</span>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.3fr_0.7fr_0.7fr]">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 xl:col-span-1">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search customer, ID, contract or email..."
                  className="w-full border-0 p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Pricing Source Filter
                <select
                  value={pricingFilter}
                  onChange={(event) => setPricingFilter(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                >
                  <option value="All">All Pricing Types</option>
                  <option value="Master">Master Pricing</option>
                  <option value="Custom">Custom Override</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email State
                <select
                  value={emailFilter}
                  onChange={(event) => setEmailFilter(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                >
                  <option value="All">All Email States</option>
                  <option value="Enabled">Enabled (ON)</option>
                  <option value="Disabled">Disabled (OFF)</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
              <span>Total Industrial Customers: {profiles.length}</span>
              <button type="button" onClick={() => { setSearchQuery(''); setPricingFilter('All'); setEmailFilter('All'); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 underline-offset-2 hover:underline">
                <Filter className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">MGO</th>
                    <th className="px-5 py-3.5">NON-MGO</th>
                    <th className="px-5 py-3.5">Excess</th>
                    <th className="px-5 py-3.5">Pricing Source</th>
                    <th className="px-5 py-3.5">Email Toggle</th>
                    <th className="px-5 py-3.5">Email Status</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => {
                    const prices = getEffectivePrices(profile, masterTariff);

                    return (
                      <tr key={profile.customerId} className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50" onClick={() => selectCustomer(profile.customerId)}>
                        <td className="px-5 py-3.5 align-top">
                          <span className="block font-semibold text-slate-900">{profile.customerName}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{profile.contractNumber} · {profile.location}</span>
                        </td>
                        <td className="px-5 py-3.5 align-top font-semibold text-emerald-700">{formatPrice(prices.mgo)}</td>
                        <td className="px-5 py-3.5 align-top font-semibold text-blue-700">{formatPrice(prices.nonMgo)}</td>
                        <td className="px-5 py-3.5 align-top font-semibold text-rose-700">{formatPrice(prices.excess)}</td>
                        <td className="px-5 py-3.5 align-top">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getExposureBadge(profile.pricingType)}`}>{profile.pricingType}</span>
                        </td>
                        <td className="px-5 py-3.5 align-top" onClick={(event) => event.stopPropagation()}>
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <input
                              type="checkbox"
                              checked={Boolean(profile.emailEnabled)}
                              onChange={(event) => toggleEmailSwitch(profile, event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                            />
                            {profile.emailEnabled ? 'ON' : 'OFF'}
                          </label>
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${profile.emailStatus === 'Sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {profile.emailStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectCustomer(profile.customerId);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:underline"
                          >
                            Configure Pricing
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Revision timeline</h3>
                <p className="mt-1 text-sm text-slate-500">Historical price updates by effective date and slab.</p>
              </div>
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="mt-4 space-y-3">
              {revisions.map((revision) => (
                <div key={revision.effectiveDate} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Effective {revision.effectiveDate}</p>
                      <p className="text-xs text-slate-500">Average rate: INR {revision.averageRate} / SCM</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{revision.rows.length} slabs</span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {revision.rows.map((row) => (
                      <div key={`${revision.effectiveDate}-${row.slab}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span>{row.slab}</span>
                        <b className="text-slate-900">INR {row.pricePerUnit} / SCM</b>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedCustomer && !isPreviewMode && (
        <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <button type="button" onClick={backToList} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Tariff Registry
              </button>
              <header className="mt-4 flex flex-wrap items-center gap-3">
                <div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Customer Override Dossier</span>
                  <h1 className="mt-3 text-2xl font-semibold text-slate-900">{selectedCustomer.customerName}</h1>
                  <p className="mt-1.5 text-sm text-slate-500">Customer ID: <strong className="text-slate-900">{selectedCustomer.customerId}</strong> | Email: <strong className="text-slate-900">{selectedCustomer.email}</strong></p>
                </div>
              </header>
            </div>
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${selectedCustomer.pricingType === 'Master' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'}`}>
                Pricing Type: {selectedCustomer.pricingType}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Pricing Strategy Selection</h3>

              <div className="mt-4 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input type="radio" name="pricingType" checked={selectedPricingType === 'Master'} onChange={() => setSelectedPricingType('Master')} />
                  Master Price (Default)
                </label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700">
                  <input type="radio" name="pricingType" checked={selectedPricingType === 'Custom'} onChange={() => setSelectedPricingType('Custom')} />
                  Custom Price Override
                </label>
              </div>

              {selectedPricingType === 'Master' ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Inheriting current Master Tariff schedule:</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">MGO</p>
                      <p className="mt-1 text-base font-semibold text-emerald-700">{formatPrice(masterTariff.mgo)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">NON-MGO</p>
                      <p className="mt-1 text-base font-semibold text-blue-700">{formatPrice(masterTariff.nonMgo)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Excess</p>
                      <p className="mt-1 text-base font-semibold text-rose-700">{formatPrice(masterTariff.excess)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-emerald-700">Source: Master Tariff Schedule</p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-sm text-slate-500">Leave field empty or override specific categories. Unspecified fields inherit from Master.</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      MGO Override
                      <input type="number" value={custEditMgo} onChange={(event) => setCustEditMgo(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-600" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      NON-MGO Override
                      <input type="number" value={custEditNonMgo} onChange={(event) => setCustEditNonMgo(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-600" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Excess Override
                      <input type="number" value={custEditExcess} onChange={(event) => setCustEditExcess(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-600" />
                    </label>
                  </div>
                  <p className="mt-3 text-sm font-medium text-rose-700">Source: Customer-specific override</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={saveCustomerOverride} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Save Custom Pricing
                </button>
                {selectedCustomer.pricingType === 'Custom' && (
                  <button type="button" onClick={resetCustomerToMaster} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                    Reset to Master Price
                  </button>
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Email Remarks & Preview</h3>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Additional Email Message
                    <textarea
                      value={customRemarks}
                      onChange={(event) => setCustomRemarks(event.target.value)}
                      className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setIsPreviewMode(true)} className="inline-flex w-1/2 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Preview Email
                  </button>
                  <button type="button" onClick={sendEmailForSelected} className="inline-flex w-1/2 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700" disabled={!selectedCustomer.emailEnabled}>
                    Send Email
                  </button>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Master & Revision Reference</h3>
                <p className="mt-1 text-sm text-slate-500">Effective prices are computed dynamically based on the active Master Tariff and customer override flags.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">MGO</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatPrice(masterTariff.mgo)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">NON-MGO</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatPrice(masterTariff.nonMgo)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Excess</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatPrice(masterTariff.excess)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {revisions.slice(0, 3).map((revision) => (
                    <div key={revision.effectiveDate} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Effective {revision.effectiveDate}</p>
                        <p className="text-xs text-slate-500">Average rate: INR {revision.averageRate} / SCM</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{revision.rows.length} slabs</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && isPreviewMode && (
        <Card className="mx-auto max-w-5xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-900">Customer Tariff Email Preview</h3>
            <button type="button" onClick={() => setIsPreviewMode(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Back to Edit
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500"><strong className="text-slate-800">To:</strong> {selectedCustomer.email}</p>
            <p className="mt-1 text-sm text-slate-500"><strong className="text-slate-800">Subject:</strong> Monthly Gas Tariff Revision – August 2026</p>
            <hr className="my-4 border-slate-200" />
            <p className="text-slate-700">Dear {selectedCustomer.customerName},</p>
            <p className="mt-2 text-slate-700">Please find below your applicable gas tariff for the month of August 2026.</p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
                <span>MGO</span>
                <strong>{formatPrice(effectivePrices?.mgo ?? masterTariff.mgo)}</strong>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
                <span>NON-MGO</span>
                <strong>{formatPrice(effectivePrices?.nonMgo ?? masterTariff.nonMgo)}</strong>
              </div>
              <div className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>Excess</span>
                <strong>{formatPrice(effectivePrices?.excess ?? masterTariff.excess)}</strong>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-700">{customRemarks}</p>
            <p className="mt-4 text-sm text-slate-700">Regards,<br />Marketing Operator</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPreviewMode(false)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Back to Edit
            </button>
            <button type="button" onClick={sendEmailForSelected} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Send Email
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default MarketingTariffRevision;
