import React, { useMemo, useState } from 'react';
import { BellRing, CalendarClock, ChevronRight, Download, FileText, Mail, Megaphone, MessageSquareText, PhoneCall, Search, Send, ShieldCheck, Users, Gauge, Target, TrendingUp, UserRoundCheck } from 'lucide-react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import CollapsibleSection from './common/CollapsibleSection';
import { campaignHistorySeed, existingCustomers as baseCustomers } from '../data/existingCustomers';
import { downloadCustomerContract } from '../utils/customerContracts';
import CustomerPortalPreview from './marketing/CustomerPortalPreview';

function isCommissioned(customer) {
  return customer.contractStatus === 'Active' || customer.contractStatus === 'Expiring soon';
}

function buildCustomers(masterGcv) {
  return baseCustomers.map((customer, index) => {
    const commissioned = isCommissioned(customer);
    const scdValue = commissioned ? Math.round(customer.dcq * 28.3168 * (0.85 + (index % 5) * 0.04)) : 0;
    const mmbtuValue = commissioned ? Number(((scdValue * masterGcv) / 252000).toFixed(2)) : 0;
    const talentValue = commissioned ? Math.round(mmbtuValue * 1250) : 0;

    return {
      ...customer,
      scdValue,
      mmbtuValue,
      talentValue,
      dailyCommunication: commissioned && index % 2 === 0,
      lastSentDate: commissioned && index % 2 === 0 ? '23 Sep 2026 · 08:00 AM' : '—',
      lastTouchDate: commissioned ? '21 Sep 2026' : '15 Sep 2026',
    };
  });
}

function deriveRetentionRisk(customer) {
  if (customer.contractStatus === 'Renewal due') return 'Critical';
  if (customer.engagementScore >= 85) return 'Healthy';
  if (customer.engagementScore >= 70) return 'Watch';
  return 'At Risk';
}

function toneForStatus(status) {
  if (status === 'Healthy') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Watch') return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-700';
}

function ExistingCustomers({ onShowToast }) {
  const toast = onShowToast ?? (() => {});
  const [masterGcv, setMasterGcv] = useState(9300);
  const [tempMasterGcv, setTempMasterGcv] = useState(9300);
  const [effectiveGcvDate, setEffectiveGcvDate] = useState('10 Aug 2026');
  const [customers, setCustomers] = useState(() => buildCustomers(9300));
  const [campaignHistory, setCampaignHistory] = useState(campaignHistorySeed);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [segment, setSegment] = useState('All');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id);
  const [campaignName, setCampaignName] = useState('Renewal Nudge');
  const [campaignSegment, setCampaignSegment] = useState('Retention');
  const [campaignChannel, setCampaignChannel] = useState('Email');
  const [detailTab, setDetailTab] = useState('overview');

  const allSegments = useMemo(() => ['All', ...new Set(customers.map((customer) => customer.segment))], [customers]);
  const allStatuses = useMemo(() => ['All', ...new Set(customers.map((customer) => deriveRetentionRisk(customer)))], [customers]);

  const { totalCustomers, commissionedCustomers, agreementYetToCommission, renewalAttention, dailyCommunicationOn, averageEngagement } = useMemo(() => {
    const commissioned = customers.filter(isCommissioned).length;
    const attention = customers.filter((customer) => customer.contractStatus === 'Renewal due' || deriveRetentionRisk(customer) === 'Critical').length;
    const communicationOn = customers.filter((customer) => customer.dailyCommunication).length;
    const average = Math.round(customers.reduce((sum, customer) => sum + customer.engagementScore, 0) / customers.length);

    return {
      totalCustomers: customers.length,
      commissionedCustomers: commissioned,
      agreementYetToCommission: customers.filter((customer) => customer.contractStatus === 'Renewal due').length,
      renewalAttention: attention,
      dailyCommunicationOn: communicationOn,
      averageEngagement: average,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const retentionRisk = deriveRetentionRisk(customer);
        return (
          (!query || [customer.name, customer.id, customer.contractNumber, customer.email, customer.phone].some((value) => value.toLowerCase().includes(query))) &&
          (!type || customer.type === type) &&
          (!industry || customer.industry === industry) &&
          (!status || retentionRisk === status) &&
          (!location || customer.location === location) &&
          (segment === 'All' || customer.segment === segment)
        );
      })
      .sort((left, right) => {
        if (sort === 'expiry') return left.expiry.localeCompare(right.expiry);
        if (sort === 'dcq') return right.dcq - left.dcq;
        if (sort === 'engagement') return right.engagementScore - left.engagementScore;
        return left.name.localeCompare(right.name);
      });
  }, [customers, industry, location, search, segment, sort, status, type]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const visibleCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? filteredCustomers[0] ?? customers[0];
  const selectedRetentionRisk = selectedCustomer ? deriveRetentionRisk(selectedCustomer) : 'Watch';

  const setPageAndClamp = (nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages));

  const resetFilters = () => {
    setSearch('');
    setType('');
    setIndustry('');
    setStatus('');
    setLocation('');
    setSegment('All');
    setSort('name');
    setPage(1);
  };

  const recalcMasterGcv = () => {
    setMasterGcv(tempMasterGcv);
    setCustomers((current) =>
      current.map((customer) => {
        if (!isCommissioned(customer)) {
          return { ...customer, scdValue: 0, mmbtuValue: 0, talentValue: 0 };
        }

        const nextMmbtuValue = Number(((customer.scdValue * tempMasterGcv) / 252000).toFixed(2));
        return {
          ...customer,
          mmbtuValue: nextMmbtuValue,
          talentValue: Math.round(nextMmbtuValue * 1250),
        };
      }),
    );
    toast(`Master GCV updated to ${tempMasterGcv} kcal/SCM and applied to commissioned customers.`);
  };

  const toggleDailyCommunication = (customerId, checked) => {
    const current = customers.find((customer) => customer.id === customerId);
    if (!current || !isCommissioned(current)) {
      toast('Daily communication is available only for commissioned customers.');
      return;
    }

    setCustomers((list) =>
      list.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              dailyCommunication: checked,
              lastSentDate: checked ? '23 Sep 2026 · 08:00 AM' : customer.lastSentDate,
            }
          : customer,
      ),
    );
  };

  const sendMorningDispatchNow = () => {
    let enabledCount = 0;
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.dailyCommunication && isCommissioned(customer)) {
          enabledCount += 1;
          return { ...customer, lastSentDate: '23 Sep 2026 · 08:00 AM' };
        }
        return customer;
      }),
    );
    toast(`Morning dispatch sent to ${enabledCount} commissioned customers with Daily Communication enabled.`);
  };

  const sendFollowUp = () => {
    if (!selectedCustomer) return;

    setCustomers((list) =>
      list.map((customer) =>
        customer.id === selectedCustomer.id
          ? {
              ...customer,
              engagementScore: Math.min(100, customer.engagementScore + 4),
              lastCampaign: 'Manual Follow-up',
              campaignOutcome: 'Responded',
            }
          : customer,
      ),
    );

    toast(`Follow-up logged for ${selectedCustomer.name}.`);
  };

  const launchCampaign = () => {
    const nextCampaign = {
      id: `CMP-${String(campaignHistory.length + 1).padStart(4, '0')}`,
      name: campaignName,
      segment: campaignSegment,
      channel: campaignChannel,
      sentAt: 'Scheduled now',
      reach: customers.filter((customer) => campaignSegment === 'All' || customer.segment === campaignSegment).length,
      openRate: 'Pending',
      response: 'Tracking enabled',
      status: 'Scheduled',
    };

    setCampaignHistory((current) => [nextCampaign, ...current]);
    setCustomers((list) =>
      list.map((customer) => {
        if (campaignSegment !== 'All' && customer.segment !== campaignSegment) return customer;
        return {
          ...customer,
          lastCampaign: campaignName,
          campaignOutcome: 'Scheduled',
          engagementScore: Math.min(100, customer.engagementScore + 2),
        };
      }),
    );
    toast(`Campaign "${campaignName}" queued for ${nextCampaign.reach} customers.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Existing Customers"
        description="Track commissioned accounts, daily consumption, GCV-driven MMBTU, engagement, retention risk, and targeted campaigns in one workspace."
        action={
          <button
            type="button"
            onClick={sendMorningDispatchNow}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Send className="h-4 w-4" />
            Trigger Morning Dispatch
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Total Customers', totalCustomers, <Users className="h-5 w-5 text-sky-600" />],
          ['Commissioned', commissionedCustomers, <ShieldCheck className="h-5 w-5 text-emerald-600" />],
          ['Yet to Commission', agreementYetToCommission, <Target className="h-5 w-5 text-amber-600" />],
          ['Renewal Attention', renewalAttention, <BellRing className="h-5 w-5 text-rose-600" />],
          ['Avg. Engagement', `${averageEngagement}%`, <TrendingUp className="h-5 w-5 text-violet-600" />],
          ['Daily Comm ON', dailyCommunicationOn, <Mail className="h-5 w-5 text-cyan-600" />],
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

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <CollapsibleSection
            title="Master Tariff Control"
            subtitle={`Master GCV active ${masterGcv} kcal/SCM · effective ${effectiveGcvDate}`}
            icon={Gauge}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block text-sm font-medium text-slate-700">
                Master GCV (kcal/SCM)
                <input
                  type="number"
                  value={tempMasterGcv}
                  onChange={(event) => setTempMasterGcv(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Effective date
                <input
                  type="text"
                  value={effectiveGcvDate}
                  onChange={(event) => setEffectiveGcvDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={recalcMasterGcv}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              Apply Master GCV
            </button>
          </CollapsibleSection>

          <CollapsibleSection
            title="Customer segmentation"
            subtitle={`${segment} segment${status ? ` · ${status} retention` : ''}`}
            icon={UserRoundCheck}
            defaultOpen
          >
            <div className="flex flex-wrap gap-2">
              {allSegments.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSegment(item);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${segment === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {allStatuses.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setStatus(item === 'All' ? '' : item);
                    setPage(1);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${status === (item === 'All' ? '' : item) ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  <span>{item}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Retention & engagement</h3>
                <p className="text-sm text-slate-500">{selectedCustomer?.name ?? 'Selected customer focus area.'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneForStatus(selectedRetentionRisk)}`}>{selectedRetentionRisk}</span>
            </div>

            {selectedCustomer && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'communication', label: 'Comms' },
                    { key: 'contract', label: 'Contract' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setDetailTab(tab.key)}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${detailTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {detailTab === 'overview' && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Engagement</span>
                      <b className="mt-1 block text-xl text-slate-900">{selectedCustomer.engagementScore}%</b>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Renewal</span>
                      <b className="mt-1 block text-xl text-slate-900">{selectedCustomer.expiry}</b>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Preferred channel</span>
                      <b className="mt-1 block text-base text-slate-900">{selectedCustomer.preferredChannel}</b>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Last campaign</span>
                      <b className="mt-1 block text-base text-slate-900">{selectedCustomer.lastCampaign}</b>
                    </div>
                  </div>
                </div>
                )}

                {detailTab === 'communication' && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Daily communication</p>
                      <p className="text-xs text-slate-500">Toggle commission-linked dispatch for the selected account.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedCustomer.dailyCommunication)}
                        onChange={(event) => toggleDailyCommunication(selectedCustomer.id, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                      />
                      {selectedCustomer.dailyCommunication ? 'ON' : 'OFF'}
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Last sent</span>
                      <b className="mt-1 block text-slate-900">{selectedCustomer.lastSentDate}</b>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Contact</span>
                      <b className="mt-1 block text-slate-900">{selectedCustomer.phone}</b>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={sendFollowUp}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Log follow-up
                  </button>
                </div>
                )}

                {detailTab === 'contract' && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Contract dossier</p>
                      <p className="text-xs text-slate-500">View the contract summary and download a generated dossier.</p>
                    </div>
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Contract number</span>
                      <b className="mt-1 block text-slate-900">{selectedCustomer.contractNumber}</b>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Expiry</span>
                      <b className="mt-1 block text-slate-900">{selectedCustomer.expiry}</b>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Industry</span>
                      <b className="mt-1 block text-slate-900">{selectedCustomer.industry}</b>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Location</span>
                      <b className="mt-1 block text-slate-900">{selectedCustomer.location}</b>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => downloadCustomerContract(selectedCustomer, masterGcv, effectiveGcvDate)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      Download contract
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(selectedCustomer.id);
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <PhoneCall className="h-4 w-4" />
                      Open contact record
                    </button>
                  </div>
                </div>
                )}
              </div>
            )}
          </Card>

          <CollapsibleSection
            title="Targeted campaign planner"
            subtitle={`${campaignName} → ${campaignSegment} · ${campaignChannel}`}
            icon={Megaphone}
          >
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Campaign name
                <input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block text-sm font-medium text-slate-700">
                  Target segment
                  <select
                    value={campaignSegment}
                    onChange={(event) => setCampaignSegment(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600"
                  >
                    <option value="All">All customers</option>
                    {allSegments.filter((item) => item !== 'All').map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Channel
                  <select
                    value={campaignChannel}
                    onChange={(event) => setCampaignChannel(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600"
                  >
                    <option>Email</option>
                    <option>WhatsApp</option>
                    <option>Phone</option>
                    <option>SMS</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={launchCampaign}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <CalendarClock className="h-4 w-4" />
                Queue campaign
              </button>
            </div>
          </CollapsibleSection>
        </div>

        <div className="space-y-6">
          <CustomerPortalPreview customer={selectedCustomer} />

          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Customer directory & consumption</h3>
                <p className="text-sm text-slate-500">Search, filter, and review daily SCM, MMBTU, engagement, and retention signals.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, ID, contract, email or phone"
                    className="w-52 min-w-0 border-0 p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:w-72"
                  />
                </div>
                <button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  Clear filters
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Industry / segment
                <select value={industry} onChange={(event) => { setIndustry(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
                  <option value="">All industries</option>
                  {[...new Set(baseCustomers.map((customer) => customer.industry))].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Retention status
                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
                  <option value="">All statuses</option>
                  <option>Healthy</option>
                  <option>Watch</option>
                  <option>At Risk</option>
                  <option>Critical</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Sort by
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
                  <option value="name">Customer name</option>
                  <option value="expiry">Contract expiry</option>
                  <option value="dcq">DCQ</option>
                  <option value="engagement">Engagement</option>
                </select>
              </label>
            </div>
          </Card>

          <Card className="p-4 lg:hidden">
            <div className="space-y-3">
              {visibleCustomers.map((customer) => {
                const retentionRisk = deriveRetentionRisk(customer);
                const activeRow = customer.id === selectedCustomerId;

                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${activeRow ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{customer.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{customer.location} · {customer.contractNumber}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneForStatus(retentionRisk)}`}>{retentionRisk}</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Status</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{customer.contractStatus}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Segment</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{customer.segment}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Daily SCM</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{customer.scdValue.toLocaleString()} SCM</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">MMBTU</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-700">{customer.mmbtuValue} MMBTU</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-sm font-medium text-slate-600">Daily communication</span>
                      <span className="text-sm font-semibold text-slate-800">{customer.dailyCommunication ? 'ON' : 'OFF'}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>Last sent</span>
                      <span className="font-medium text-slate-800">{customer.lastSentDate}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Engagement {customer.engagementScore}%</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedCustomerId(customer.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View contract
                      </button>
                    </div>
                  </button>
                );
              })}
              {filteredCustomers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</div>
              )}
            </div>
          </Card>

          <Card className="hidden lg:block">
            <div className="relative">
              <div className="overflow-x-auto rounded-t-xl">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="w-[26%] px-5 py-4">Customer</th>
                    <th className="w-[16%] px-5 py-4">Status &amp; segment</th>
                    <th className="w-[18%] px-5 py-4">Consumption</th>
                    <th className="w-[18%] px-5 py-4">Engagement &amp; retention</th>
                    <th className="w-[14%] px-5 py-4">Communication</th>
                    <th className="w-[8%] px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCustomers.map((customer) => {
                    const retentionRisk = deriveRetentionRisk(customer);
                    const activeRow = customer.id === selectedCustomerId;

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`cursor-pointer border-t border-slate-200 transition hover:bg-slate-50 ${activeRow ? 'bg-emerald-50/70' : ''}`}
                      >
                        <td className="px-5 py-4 align-top">
                          <button type="button" className="text-left">
                            <span className="block truncate font-semibold text-slate-900">{customer.name}</span>
                            <span className="mt-1 block truncate text-xs text-slate-500">{customer.location} · {customer.contractNumber}</span>
                          </button>
                        </td>
                        <td className="px-5 py-4 align-top text-slate-700">
                          <span className="block truncate">{customer.contractStatus}</span>
                          <span className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{customer.segment}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="block font-semibold text-slate-900">{customer.scdValue.toLocaleString()} SCM</span>
                          <span className="mt-1 block text-xs font-semibold text-emerald-700">{customer.mmbtuValue} MMBTU</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-14 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-sky-500" style={{ width: `${customer.engagementScore}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{customer.engagementScore}%</span>
                          </div>
                          <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${toneForStatus(retentionRisk)}`}>{retentionRisk}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <input
                              type="checkbox"
                              checked={Boolean(customer.dailyCommunication)}
                              onChange={(event) => toggleDailyCommunication(customer.id, event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                            />
                            {customer.dailyCommunication ? 'ON' : 'OFF'}
                          </label>
                          <span className="mt-1.5 block truncate text-xs text-slate-500">{customer.lastSentDate}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCustomerId(customer.id);
                            }}
                            title="View contract"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-tr-xl bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {visibleCustomers.length} of {filteredCustomers.length} customers · Effective GCV updated on {effectiveGcvDate}
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <span>Rows</span>
                  <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700 outline-none">
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page === 1} onClick={() => setPageAndClamp(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40">
                    Prev
                  </button>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Page {page} of {totalPages}</span>
                  <button type="button" disabled={page === totalPages} onClick={() => setPageAndClamp(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Campaign history</h3>
                <p className="text-sm text-slate-500">Recent retention, loyalty, and reactivation campaigns with outcomes.</p>
              </div>
              <BellRing className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {campaignHistory.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{campaign.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{campaign.segment} · {campaign.channel}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campaign.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{campaign.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Sent</span>
                      <b className="mt-1 block text-slate-900">{campaign.sentAt}</b>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Reach</span>
                      <b className="mt-1 block text-slate-900">{campaign.reach}</b>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Open rate</span>
                      <b className="mt-1 block text-slate-900">{campaign.openRate}</b>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Response</span>
                      <b className="mt-1 block text-slate-900">{campaign.response}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ExistingCustomers;