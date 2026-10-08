import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Banknote, BellRing, Download, Filter, HandCoins, Search, ShieldCheck, TimerReset, WalletCards, Users } from 'lucide-react';
import Card from '../common/Card';
import SectionHeading from '../common/SectionHeading';
import { marketingBillingProfiles } from '../../data/marketingBillingExposure';
import { generateDownload } from '../../utils/download';

function sumSecurity(profile) {
  return profile.paymentSecurityDetails.reduce((sum, item) => sum + item.amount, 0);
}

function toCr(value) {
  return Number((value / 100).toFixed(2));
}

/* All profile amounts are stored in ₹ Lakhs; format consistently and guard against bad input */
function formatLakhs(value) {
  const amount = Number.isFinite(value) ? value : 0;
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
}

function safePercentage(numerator, denominator) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function getExposureBand(profile) {
  const security = sumSecurity(profile);
  const utilization = security > 0 ? (profile.outstanding / security) * 100 : 0;

  if (profile.outstanding > security) return { label: 'Over Exposure', tone: 'bg-rose-100 text-rose-700' };
  if (utilization >= 80) return { label: 'Near Limit', tone: 'bg-amber-100 text-amber-800' };
  return { label: 'Within Limit', tone: 'bg-emerald-100 text-emerald-700' };
}

function MarketingBillingExposure({ onShowToast }) {
  const showToast = onShowToast ?? (() => {});
  const [profiles, setProfiles] = useState(marketingBillingProfiles);
  const [selectedCustomerId, setSelectedCustomerId] = useState(marketingBillingProfiles[0]?.customerId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');

  const selectedCustomer = useMemo(
    () => profiles.find((profile) => profile.customerId === selectedCustomerId) ?? profiles[0],
    [profiles, selectedCustomerId],
  );

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return profiles.filter((profile) => {
      const band = getExposureBand(profile).label;
      const matchesQuery =
        !query ||
        [profile.customerName, profile.customerId, profile.contractNumber, profile.industry, profile.location]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'All' || band === statusFilter;
      const matchesSegment = segmentFilter === 'All' || profile.segment === segmentFilter;
      return matchesQuery && matchesStatus && matchesSegment;
    });
  }, [profiles, searchQuery, statusFilter, segmentFilter]);

  const summary = useMemo(() => {
    const totalOutstanding = profiles.reduce((sum, profile) => sum + profile.outstanding, 0);
    const totalSecurity = profiles.reduce((sum, profile) => sum + sumSecurity(profile), 0);
    const overExposed = profiles.filter((profile) => profile.outstanding > sumSecurity(profile)).length;
    const nearLimit = profiles.filter((profile) => {
      const security = sumSecurity(profile);
      return profile.outstanding <= security && (profile.outstanding / security) * 100 >= 80;
    }).length;
    const withinLimit = profiles.length - overExposed - nearLimit;
    const avgUtilization = profiles.length
      ? Math.round(
          profiles.reduce((sum, profile) => sum + safePercentage(profile.outstanding, sumSecurity(profile)), 0) / profiles.length,
        )
      : 0;

    return {
      totalCustomers: profiles.length,
      totalOutstanding: toCr(totalOutstanding),
      totalSecurity: toCr(totalSecurity),
      overExposed,
      nearLimit,
      withinLimit,
      avgUtilization,
    };
  }, [profiles]);

  const selectedSecurity = selectedCustomer ? sumSecurity(selectedCustomer) : 0;
  const selectedExposure = selectedCustomer ? safePercentage(selectedCustomer.outstanding, selectedSecurity) : 0;

  const exportSnapshot = () => {
    const content = [
      'Marketing Bills & Payments Exposure Snapshot',
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      `Total customers: ${summary.totalCustomers}`,
      `Total outstanding: ₹ ${summary.totalOutstanding} Cr`,
      `Total security: ₹ ${summary.totalSecurity} Cr`,
      '',
      ...filteredProfiles.map((profile) => {
        const band = getExposureBand(profile);
        return `${profile.customerName} | ${profile.contractNumber} | ${band.label} | Outstanding ${profile.outstanding} L | Security ${sumSecurity(profile)} L`;
      }),
    ].join('\n');

    generateDownload('marketing_billing_exposure_snapshot.txt', content, 'text/plain');
    showToast('Exposure snapshot downloaded');
  };

  const markFollowUp = () => {
    if (!selectedCustomer) return;
    setProfiles((current) =>
      current.map((profile) =>
        profile.customerId === selectedCustomer.customerId
          ? {
              ...profile,
              nextAction: 'Follow-up logged by marketing',
              lastPayment: profile.lastPayment,
            }
          : profile,
      ),
    );
    showToast(`Follow-up logged for ${selectedCustomer.customerName}`);
  };

  const detailRows = selectedCustomer
    ? [
        { label: 'Current bill', value: formatLakhs(selectedCustomer.currentBill ?? 0) },
        { label: 'Total Outstanding', value: formatLakhs(selectedCustomer.outstanding ?? 0) },
        { label: 'Current unbilled value', value: formatLakhs(selectedCustomer.notYetDueAmount ?? 0) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Bills & Payments Exposure"
        description="Monitor customer exposure, payment security, aging, and collection risk for marketing-owned industrial accounts."
        action={
          <button
            type="button"
            onClick={exportSnapshot}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export exposure snapshot
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Customers', summary.totalCustomers, <Users className="h-5 w-5 text-sky-600" />],
          ['Outstanding', `₹ ${summary.totalOutstanding} Cr`, <Banknote className="h-5 w-5 text-rose-600" />],
          ['Security', `₹ ${summary.totalSecurity} Cr`, <ShieldCheck className="h-5 w-5 text-emerald-600" />],
        ].map(([label, value, icon]) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">{icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Portfolio risk breakdown</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search customer, contract, location..."
                    aria-label="Search customers"
                    className="w-52 min-w-0 border-0 p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:w-72"
                  />
                </div>
                <button type="button" onClick={() => { setSearchQuery(''); setStatusFilter('All'); setSegmentFilter('All'); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <Filter className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Exposure status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['All', 'Within Limit', 'Near Limit', 'Over Exposure'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={statusFilter === item}
                      onClick={() => setStatusFilter(item)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Customer segment</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['All', ...new Set(profiles.map((profile) => profile.segment))].map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={segmentFilter === item}
                      onClick={() => setSegmentFilter(item)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${segmentFilter === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filteredProfiles.map((profile) => {
                const band = getExposureBand(profile);
                const isActive = profile.customerId === selectedCustomer?.customerId;

                return (
                  <button
                    key={profile.customerId}
                    type="button"
                    onClick={() => setSelectedCustomerId(profile.customerId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${isActive ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{profile.customerName}</div>
                        <div className="mt-1 text-xs text-slate-500">{profile.customerId} · {profile.location}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${band.tone}`}>{band.label}</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Current bill</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">₹ {profile.currentBill} L</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Payment security</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-700">₹ {sumSecurity(profile)} L</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Aging</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{profile.oldestOutstandingDays} days</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Next action</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{profile.nextAction}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredProfiles.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</div>
              )}
            </div>

            <div className="mt-5 hidden lg:block">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="w-[34%] px-4 py-3">Customer</th>
                      <th className="w-[24%] px-4 py-3">Billing</th>
                      <th className="w-[26%] px-4 py-3">Risk</th>
                      <th className="w-[16%] px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => {
                      const band = getExposureBand(profile);
                      const isActive = profile.customerId === selectedCustomer?.customerId;
                      return (
                        <tr
                          key={profile.customerId}
                          onClick={() => setSelectedCustomerId(profile.customerId)}
                          className={`cursor-pointer border-t border-slate-200 transition hover:bg-slate-50 ${isActive ? 'bg-emerald-50/70' : ''}`}
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="truncate font-semibold text-slate-900">{profile.customerName}</div>
                            <div className="mt-1 truncate text-xs text-slate-500">{profile.customerId} · {profile.location}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="text-slate-700">₹ {profile.currentBill} L bill</div>
                            <div className="mt-1 text-xs font-semibold text-emerald-700">₹ {sumSecurity(profile)} L security</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${band.tone}`}>{band.label}</span>
                            <div className="mt-1 text-xs text-slate-500">{profile.oldestOutstandingDays} days aging</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedCustomerId(profile.customerId);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProfiles.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Exposure distribution</h3>
                <p className="text-sm text-slate-500">Corporate risk summary across the marketing-owned portfolio.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Within Limit: {summary.withinLimit}</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Near Limit: {summary.nearLimit}</span>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Over Exposure: {summary.overExposed}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                { label: 'Average utilization', value: `${summary.avgUtilization}%`, tone: 'bg-sky-50 text-sky-700' },
                { label: 'Available headroom', value: `₹ ${Math.max(summary.totalSecurity - summary.totalOutstanding, 0).toFixed(2)} Cr`, tone: 'bg-emerald-50 text-emerald-700' },
                { label: 'Collection focus', value: `${summary.overExposed + summary.nearLimit} accounts`, tone: 'bg-rose-50 text-rose-700' },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl px-4 py-3 ${item.tone}`}>
                  <p className="text-xs uppercase tracking-[0.16em] opacity-70">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Selected customer</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{selectedCustomer.customerName}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer.contractNumber} · {selectedCustomer.location}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getExposureBand(selectedCustomer).tone}`}>{getExposureBand(selectedCustomer).label}</span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {detailRows.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Security utilization</p>
                    <p className="text-xs text-slate-500">Outstanding vs security held for the selected account.</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{selectedExposure.toFixed(2)}%</div>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${selectedCustomer.outstanding > selectedSecurity ? 'bg-rose-500' : selectedExposure >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(selectedExposure, 100)}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{selectedCustomer.riskNote}</p>
              </div>

              <div className={`rounded-2xl p-4 ${selectedCustomer.outstanding > selectedSecurity ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-semibold">{selectedCustomer.outstanding > selectedSecurity ? 'Payment security shortfall' : 'Within secure limit'}</p>
                    <p className="mt-1 text-sm">
                      {selectedCustomer.outstanding > selectedSecurity
                        ? `Outstanding exceeds available security by ₹ ${(selectedCustomer.outstanding - selectedSecurity).toFixed(2)} L.`
                        : 'The account is fully covered by active security instruments.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MarketingBillingExposure;
