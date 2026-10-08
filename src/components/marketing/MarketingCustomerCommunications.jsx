import React, { useMemo, useState } from 'react';
import { AlertTriangle, BellRing, ChevronRight, Gauge, Mail, Search, Send, ShieldCheck, Sparkles, TimerReset, Users } from 'lucide-react';
import Card from '../common/Card';
import SectionHeading from '../common/SectionHeading';
import CollapsibleSection from '../common/CollapsibleSection';
import MarketingTariffRevision from './MarketingTariffRevision';
import {
  DEFAULT_EFFECTIVE_GCV_DATE,
  DISPATCH_TIMESTAMP,
  MASTER_GCV_DEFAULT,
  applyMasterGcvToCommunicationProfiles,
  buildCommunicationProfiles,
  isCommissioned,
} from '../../utils/customerCommunications';

const COMMUNICATION_SECTIONS = [
  {
    id: 'tariff',
    title: 'Tariff Communications',
    icon: Sparkles,
    eyebrow: 'Rate circulars',
    summary: 'Send tariff updates, pricing advisories, and revision notices to industrial customers.',
    audience: 'Customer billing owners and contract managers',
    cadence: 'As revised tariff is approved or effective date changes',
    channels: ['Email', 'WhatsApp', 'Portal notice'],
    templates: ['Tariff revision notice', 'Slab update summary', 'Price change acknowledgement'],
  },
  {
    id: 'consumption',
    title: 'Consumption Communications',
    icon: Users,
    eyebrow: 'Usage trends',
    summary: 'Share daily consumption trends, monthly draw summaries, and high-usage alerts.',
    audience: 'Plant operations, production planning, and finance',
    cadence: 'Daily, weekly, and month-end review cycle',
    channels: ['Dashboard card', 'Email', 'WhatsApp'],
    templates: ['Daily consumption digest', 'Monthly usage recap', 'Peak day alert'],
  },
  {
    id: 'other',
    title: 'Other Communications',
    icon: BellRing,
    eyebrow: 'General notices',
    summary: 'Handle reminders, service notices, acknowledgements, and ad-hoc customer updates.',
    audience: 'Any mapped customer contact point',
    cadence: 'On demand',
    channels: ['Email', 'Phone', 'Portal notification'],
    templates: ['Payment reminder', 'Service advisory', 'Acknowledgement note'],
  },
];

const CHANNEL_BADGES = {
  Email: 'bg-sky-50 text-sky-700',
  WhatsApp: 'bg-emerald-50 text-emerald-700',
  SMS: 'bg-amber-50 text-amber-800',
  Phone: 'bg-violet-50 text-violet-700',
  'Portal notice': 'bg-slate-100 text-slate-700',
  'Portal alert': 'bg-slate-100 text-slate-700',
  'Dashboard card': 'bg-slate-100 text-slate-700',
};

function buildDraftPreview(section, customer, masterGcv, effectiveGcvDate) {
  if (!customer) return 'Select a customer to preview the communication draft.';

  const commonLines = [
    `Customer: ${customer.name}`,
    `Contract: ${customer.contractNumber}`,
    `Location: ${customer.location}`,
    `Current unbilled value: ₹ ${customer.currentUnbilledValue.toFixed(2)} L`,
    `Outstanding: ₹ ${customer.outstanding.toFixed(2)} L`,
    `Conversion reference: ${masterGcv} kcal/SCM`,
  ];

  switch (section.id) {
    case 'tariff':
      return [
        `Tariff communication for ${customer.name}`,
        `Effective date: ${effectiveGcvDate}`,
        'Please review the updated tariff circular and confirm acknowledgement.',
        ...commonLines,
      ].join('\n');
    case 'consumption':
      return [
        `Consumption communication for ${customer.name}`,
        `Daily consumption: ${customer.currentConsumption.toLocaleString()} SCM`,
        `MMBTU @ GCV: ${customer.mmbtuValue.toFixed(1)} MMBTU`,
        'Please review the latest draw profile and operational trend.',
        ...commonLines,
      ].join('\n');
    default:
      return [
        `Other communication for ${customer.name}`,
        'This draft can be used for reminders, service notices, acknowledgements, and general follow-up.',
        ...commonLines,
      ].join('\n');
  }
}

function MarketingCustomerCommunications({ onShowToast }) {
  const showToast = onShowToast ?? (() => {});
  const initialCustomers = useMemo(() => buildCommunicationProfiles(MASTER_GCV_DEFAULT), []);
  const [masterGcv, setMasterGcv] = useState(MASTER_GCV_DEFAULT);
  const [tempMasterGcv, setTempMasterGcv] = useState(MASTER_GCV_DEFAULT);
  const [effectiveGcvDate, setEffectiveGcvDate] = useState(DEFAULT_EFFECTIVE_GCV_DATE);
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomers[0]?.id ?? null);
  const [activeSectionId, setActiveSectionId] = useState(COMMUNICATION_SECTIONS[0].id);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const activeSection = useMemo(
    () => COMMUNICATION_SECTIONS.find((section) => section.id === activeSectionId) ?? COMMUNICATION_SECTIONS[0],
    [activeSectionId],
  );

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0] ?? null,
    [customers, selectedCustomerId],
  );

  const enabledRecipients = useMemo(
    () => customers.filter((customer) => customer.dailyCommunication && isCommissioned(customer)),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesQuery =
        !query ||
        [customer.name, customer.id, customer.contractNumber, customer.industry, customer.location].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Enabled'
            ? Boolean(customer.dailyCommunication)
            : statusFilter === 'Disabled'
              ? !customer.dailyCommunication
              : isCommissioned(customer);
      return matchesQuery && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const summary = useMemo(() => {
    const totalCustomers = customers.length;
    const commissionedCustomers = customers.filter(isCommissioned).length;
    const dailyMailEnabled = customers.filter((customer) => customer.dailyCommunication).length;
    const readyForDispatch = customers.filter((customer) => isCommissioned(customer) && customer.dailyCommunication).length;

    return {
      totalCustomers,
      commissionedCustomers,
      dailyMailEnabled,
      readyForDispatch,
    };
  }, [customers]);

  const applyMasterGcv = () => {
    setMasterGcv(tempMasterGcv);
    setCustomers((current) => applyMasterGcvToCommunicationProfiles(current, tempMasterGcv));
    showToast(`Master GCV updated to ${tempMasterGcv} kcal/SCM and applied to customer communications.`);
  };

  const toggleDailyCommunication = (customerId, checked) => {
    const current = customers.find((customer) => customer.id === customerId);
    if (!current || !isCommissioned(current)) {
      showToast('Daily mail communication is available only for commissioned customers.');
      return;
    }

    setCustomers((currentList) =>
      currentList.map((customer) =>
        customer.id === customerId
          ? { ...customer, dailyCommunication: checked, lastSentDate: checked ? DISPATCH_TIMESTAMP : customer.lastSentDate }
          : customer,
      ),
    );
  };

  const sendDailyDispatch = () => {
    let enabledCount = 0;
    setCustomers((currentList) =>
      currentList.map((customer) => {
        if (customer.dailyCommunication && isCommissioned(customer)) {
          enabledCount += 1;
          return { ...customer, lastSentDate: DISPATCH_TIMESTAMP };
        }
        return customer;
      }),
    );
    showToast(`Daily mail dispatched to ${enabledCount} commissioned customers.`);
  };

  const sendBroadcastCommunication = () => {
    const message = broadcastMessage.trim();
    if (!message) {
      showToast('Type a message before sending it to enabled customers.');
      return;
    }

    setCustomers((currentList) =>
      currentList.map((customer) =>
        customer.dailyCommunication && isCommissioned(customer)
          ? { ...customer, lastSentDate: DISPATCH_TIMESTAMP }
          : customer,
      ),
    );
    showToast(`Broadcast sent to ${enabledRecipients.length} enabled customers.`);
    setBroadcastMessage('');
  };

  const sendSectionCommunication = () => {
    if (activeSection.id === 'other') {
      sendBroadcastCommunication();
      return;
    }

    if (!selectedCustomer) return;
    setCustomers((currentList) =>
      currentList.map((customer) => (customer.id === selectedCustomer.id ? { ...customer, lastSentDate: DISPATCH_TIMESTAMP } : customer)),
    );
    showToast(`${activeSection.title} sent for ${selectedCustomer.name}`);
  };

  const previewDraft = buildDraftPreview(activeSection, selectedCustomer, masterGcv, effectiveGcvDate);
  const selectedCustomerHighlights = selectedCustomer
    ? [
        { label: 'Current unbilled', value: `₹ ${selectedCustomer.currentUnbilledValue.toFixed(2)} L`, tone: 'bg-sky-50 text-sky-700' },
        { label: 'Outstanding', value: `₹ ${selectedCustomer.outstanding.toFixed(2)} L`, tone: 'bg-rose-50 text-rose-700' },
        { label: 'Daily mail', value: selectedCustomer.dailyCommunication ? 'Enabled' : 'Disabled', tone: selectedCustomer.dailyCommunication ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
        { label: 'Last sent', value: selectedCustomer.lastSentDate, tone: 'bg-violet-50 text-violet-700' },
      ]
    : [];

  const handlePreview = () => {
    if (!selectedCustomer) return;
    showToast(`${activeSection.title} draft preview opened for ${selectedCustomer.name}`);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Customer Communications"
        description="Centralize tariff, consumption, daily mail, and other individual customer communications in one place."
        action={
          <button
            type="button"
            onClick={sendDailyDispatch}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Send className="h-4 w-4" />
            Send Daily Mail
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Customers', summary.totalCustomers, <Users className="h-5 w-5 text-sky-600" />],
          ['Commissioned', summary.commissionedCustomers, <ShieldCheck className="h-5 w-5 text-emerald-600" />],
          ['Daily Mail Enabled', summary.dailyMailEnabled, <BellRing className="h-5 w-5 text-amber-600" />],
          ['Ready for Dispatch', summary.readyForDispatch, <TimerReset className="h-5 w-5 text-violet-600" />],
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

      <CollapsibleSection
        title="Master GCV Control"
        subtitle={`Master GCV active ${masterGcv} kcal/SCM · effective ${effectiveGcvDate}`}
        icon={Gauge}
        defaultOpen
      >
        <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="flex items-end">
            <button
              type="button"
              onClick={applyMasterGcv}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              Apply Master GCV
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COMMUNICATION_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSectionId;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={`rounded-2xl border p-4 text-left transition ${isActive ? 'border-emerald-500 bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{section.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{section.title}</h3>
                </div>
                <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{section.summary}</p>
            </button>
          );
        })}
      </div>

      {activeSectionId === 'tariff' ? (
        <MarketingTariffRevision onShowToast={showToast} />
      ) : (
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="min-w-0 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Individual customer communications</h3>
              <p className="mt-1 text-sm text-slate-500">Manage daily mail, tariff, GCV, consumption, and other customer messages from one queue.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer, contract, location..."
                  className="w-52 min-w-0 border-0 p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:w-72"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', 'Enabled', 'Disabled', 'Commissioned'].map((item) => (
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
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[920px] table-fixed border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="w-[30%] px-4 py-3">Customer</th>
                  <th className="w-[20%] px-4 py-3">Consumption</th>
                  <th className="w-[16%] px-4 py-3">Daily Mail</th>
                  <th className="w-[16%] px-4 py-3">Last Sent</th>
                  <th className="w-[18%] px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const commissioned = isCommissioned(customer);
                  const isSelected = selectedCustomer?.id === customer.id;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`cursor-pointer border-t border-slate-200 transition hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/70' : ''}`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-slate-900">{customer.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{customer.contractNumber} · {customer.location}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-slate-700">{customer.currentConsumption.toLocaleString()} SCM/day</div>
                        <div className="mt-1 text-xs text-slate-500">{customer.mmbtuValue.toFixed(1)} MMBTU @ GCV</div>
                      </td>
                      <td className="px-4 py-3 align-top" onClick={(event) => event.stopPropagation()}>
                        {commissioned ? (
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <input
                              type="checkbox"
                              checked={Boolean(customer.dailyCommunication)}
                              onChange={(event) => toggleDailyCommunication(customer.id, event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                            />
                            {customer.dailyCommunication ? 'Enabled' : 'Disabled'}
                          </label>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${customer.lastSentDate !== '—' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {customer.lastSentDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${commissioned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {commissioned ? 'Commissioned' : 'Agreement Signed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
            <span>Daily dispatch runs use the current active Master GCV.</span>
          </div>
        </Card>

        <div className="min-w-0">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Selected customer</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{selectedCustomer?.name ?? 'Select a customer'}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer ? `${selectedCustomer.contractNumber} · ${selectedCustomer.location}` : 'Pick a customer from the table to build a communication draft.'}</p>
              </div>
              {selectedCustomer && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isCommissioned(selectedCustomer) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                  {isCommissioned(selectedCustomer) ? 'Commissioned' : 'Agreement Signed'}
                </span>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 p-4">

              <div className="mt-3 flex flex-wrap gap-2">
                {activeSection.channels.map((channel) => (
                  <span key={channel} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${CHANNEL_BADGES[channel] ?? 'bg-slate-100 text-slate-700'}`}>
                    {channel}
                  </span>
                ))}
              </div>

                {activeSection.id === 'other' ? (
                  <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Broadcast message</p>
                      <p className="mt-1 text-xs text-slate-500">
                        This message will be sent to all enabled customers in the current registry.
                      </p>
                    </div>
                    <textarea
                      value={broadcastMessage}
                      onChange={(event) => setBroadcastMessage(event.target.value)}
                      rows={5}
                      placeholder="Type any notice, reminder, or ad-hoc message here..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">Enabled recipients: {enabledRecipients.length}</p>
                      <button
                        type="button"
                        onClick={sendSectionCommunication}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Mail className="h-4 w-4" />
                        Send to enabled customers
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                      <pre className="whitespace-pre-wrap font-sans leading-6">{previewDraft}</pre>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handlePreview}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Mail className="h-4 w-4" />
                        Preview draft
                      </button>
                      <button
                        type="button"
                        onClick={sendSectionCommunication}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                        Send to customer
                      </button>
                    </div>
                  </>
                )}
            </div>

            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <p>
                  This menu is the single place for individual customer communication workflows, daily mail controls, and master GCV application.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}

export default MarketingCustomerCommunications;