import React, { useMemo, useState } from 'react';
import { BellRing, ChevronRight, Download, Gauge, Search, Send, ShieldCheck, Target, Users } from 'lucide-react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import CollapsibleSection from './common/CollapsibleSection';
import Drawer from './common/Drawer';
import CustomerCollaborationPanel from './common/CustomerCollaborationPanel';
import { existingCustomers as baseCustomers } from '../data/existing-customers.data';
import { downloadCustomerContract } from '../utils/customerContracts';

const DISPATCH_TIMESTAMP = '23 Sep 2026 · 08:00 AM';

function isCommissioned(customer) {
  return customer.contractStatus === 'Active' || customer.contractStatus === 'Expiring soon';
}

function customerStatusLabel(customer) {
  return isCommissioned(customer) ? 'Commissioned' : 'Agreement Signed - Yet to Commission';
}

function buildCustomers(masterGcv) {
  return baseCustomers.map((customer, index) => {
    const commissioned = isCommissioned(customer);
    const scdValue = commissioned ? Math.round(customer.dcq * 28.3168 * (0.85 + (index % 5) * 0.04)) : 0;
    const mmbtuValue = commissioned ? Number(((scdValue * masterGcv) / 252000).toFixed(2)) : 0;

    return {
      ...customer,
      scdValue,
      mmbtuValue,
      dailyCommunication: commissioned && index % 2 === 0,
      lastSentDate: commissioned && index % 2 === 0 ? DISPATCH_TIMESTAMP : '—',
    };
  });
}

function ExistingCustomers({ onShowToast }) {
  const toast = onShowToast ?? (() => {});
  const [masterGcv, setMasterGcv] = useState(9300);
  const [tempMasterGcv, setTempMasterGcv] = useState(9300);
  const [effectiveGcvDate, setEffectiveGcvDate] = useState('10 Aug 2026');
  const [customers, setCustomers] = useState(() => buildCustomers(9300));
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openCustomerDetail = (customerId) => {
    setSelectedCustomerId(customerId);
    setDrawerOpen(true);
  };

  const { totalCustomers, commissionedCustomers, agreementYetToCommission, renewalAttention } = useMemo(
    () => ({
      totalCustomers: customers.length,
      commissionedCustomers: customers.filter(isCommissioned).length,
      agreementYetToCommission: customers.filter((customer) => !isCommissioned(customer)).length,
      renewalAttention: customers.filter((customer) => customer.contractStatus === 'Renewal due').length,
    }),
    [customers],
  );

  const allIndustries = useMemo(() => [...new Set(baseCustomers.map((customer) => customer.industry))], []);
  const allLocations = useMemo(() => [...new Set(baseCustomers.map((customer) => customer.location))], []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter(
        (customer) =>
          (!query || [customer.name, customer.id, customer.contractNumber, customer.email, customer.phone].some((value) => value.toLowerCase().includes(query))) &&
          (!type || customer.type === type) &&
          (!industry || customer.industry === industry) &&
          (!status || customer.contractStatus === status) &&
          (!location || customer.location === location),
      )
      .sort((left, right) => {
        if (sort === 'expiry') return left.expiry.localeCompare(right.expiry);
        if (sort === 'dcq') return right.dcq - left.dcq;
        return left.name.localeCompare(right.name);
      });
  }, [customers, industry, location, search, sort, status, type]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const visibleCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? null;

  const setPageAndClamp = (nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages));

  const resetFilters = () => {
    setSearch('');
    setType('');
    setIndustry('');
    setStatus('');
    setLocation('');
    setSort('name');
    setPage(1);
  };

  const recalcMasterGcv = () => {
    setMasterGcv(tempMasterGcv);
    setCustomers((current) =>
      current.map((customer) => {
        if (!isCommissioned(customer)) return { ...customer, scdValue: 0, mmbtuValue: 0 };
        return { ...customer, mmbtuValue: Number(((customer.scdValue * tempMasterGcv) / 252000).toFixed(2)) };
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
          ? { ...customer, dailyCommunication: checked, lastSentDate: checked ? DISPATCH_TIMESTAMP : customer.lastSentDate }
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
          return { ...customer, lastSentDate: DISPATCH_TIMESTAMP };
        }
        return customer;
      }),
    );
    toast(`Morning dispatch sent to ${enabledCount} commissioned customers with Daily Communication enabled.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Existing Customers"
        description="Customer relationships, contracts, daily consumption, and Master GCV controls in one workspace."
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Customers', totalCustomers, <Users className="h-5 w-5 text-sky-600" />],
          ['Commissioned Customers', commissionedCustomers, <ShieldCheck className="h-5 w-5 text-emerald-600" />],
          ['Agreement Signed - Yet to Commission', agreementYetToCommission, <Target className="h-5 w-5 text-amber-600" />],
          ['Renewal Attention', renewalAttention, <BellRing className="h-5 w-5 text-rose-600" />],
        ].map(([label, value, icon]) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">{icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <CollapsibleSection
        title="Master Tariff Control"
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
              onClick={recalcMasterGcv}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              Apply Master GCV
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <Card className="p-5">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, ID, contract, email or phone"
            className="w-full border-0 p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block text-sm font-medium text-slate-700">
            Customer type
            <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
              <option value="">All types</option>
              <option>Industrial</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Industry
            <select value={industry} onChange={(event) => { setIndustry(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
              <option value="">All industries</option>
              {allIndustries.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contract status
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Renewal due</option>
              <option>Expiring soon</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Location
            <select value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
              <option value="">All locations</option>
              {allLocations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600">
              <option value="name">Customer name</option>
              <option value="expiry">Contract expiry</option>
              <option value="dcq">DCQ</option>
            </select>
          </label>
        </div>

        <button type="button" onClick={resetFilters} className="mt-3 text-xs font-semibold text-slate-500 underline-offset-2 hover:underline">
          Clear filters
        </button>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Customer Directory &amp; Consumption</p>
          <span className="text-xs text-slate-500">{filteredCustomers.length} customers found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Customer Status</th>
                <th className="px-5 py-3.5">Agreement Expiry</th>
                <th className="px-5 py-3.5">Daily SCM</th>
                <th className="px-5 py-3.5">MMBTU (@ {masterGcv} GCV)</th>
                <th className="px-5 py-3.5">Daily Communication</th>
                <th className="px-5 py-3.5">Last Sent Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {visibleCustomers.map((customer) => {
                const commissioned = isCommissioned(customer);

                return (
                  <tr key={customer.id} onClick={() => openCustomerDetail(customer.id)} className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-3.5 align-top">
                      <span className="block font-semibold text-slate-900">{customer.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{customer.location}</span>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${commissioned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                        {customerStatusLabel(customer)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-top text-slate-700">{customer.expiry}</td>
                    <td className="px-5 py-3.5 align-top font-semibold text-slate-900">
                      {customer.scdValue > 0 ? `${customer.scdValue.toLocaleString()} SCM` : <span className="font-normal text-slate-400">0 SCM (Uncommissioned)</span>}
                    </td>
                    <td className="px-5 py-3.5 align-top font-semibold text-emerald-700">
                      {customer.mmbtuValue > 0 ? `${customer.mmbtuValue} MMBTU` : <span className="font-normal text-slate-400">0 MMBTU</span>}
                    </td>
                    <td className="px-5 py-3.5 align-top" onClick={(event) => event.stopPropagation()}>
                      {commissioned ? (
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(customer.dailyCommunication)}
                            onChange={(event) => toggleDailyCommunication(customer.id, event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                          />
                          {customer.dailyCommunication ? 'ON' : 'OFF'}
                        </label>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${customer.lastSentDate !== '—' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {customer.lastSentDate}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openCustomerDetail(customer.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:underline"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {visibleCustomers.length} of {filteredCustomers.length} customers</span>
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

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedCustomer?.name ?? 'Customer profile'}
        subtitle={selectedCustomer ? `${selectedCustomer.contractNumber} · ${selectedCustomer.industry} · ${selectedCustomer.location}` : ''}
        badge={selectedCustomer && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isCommissioned(selectedCustomer) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            {customerStatusLabel(selectedCustomer)}
          </span>
        )}
      >
        {selectedCustomer && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Agreement Expiry</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCustomer.expiry}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Contract DCQ</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCustomer.dcq.toLocaleString()} SCM</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Daily SCM</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCustomer.scdValue.toLocaleString()} SCM</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">MMBTU @ GCV</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">{selectedCustomer.mmbtuValue} MMBTU</p>
              </div>
            </div>

            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-900">Contact &amp; contract</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Contract number</span>
                  <b className="mt-1 block text-slate-900">{selectedCustomer.contractNumber}</b>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Email</span>
                  <b className="mt-1 block text-slate-900">{selectedCustomer.email}</b>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Phone</span>
                  <b className="mt-1 block text-slate-900">{selectedCustomer.phone}</b>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Location</span>
                  <b className="mt-1 block text-slate-900">{selectedCustomer.location}</b>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Daily communication</p>
                  <p className="text-xs text-slate-500">Last sent: {selectedCustomer.lastSentDate}</p>
                </div>
                {isCommissioned(selectedCustomer) ? (
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedCustomer.dailyCommunication)}
                      onChange={(event) => toggleDailyCommunication(selectedCustomer.id, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    {selectedCustomer.dailyCommunication ? 'ON' : 'OFF'}
                  </label>
                ) : (
                  <span className="text-xs text-slate-400">N/A</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => downloadCustomerContract(selectedCustomer, masterGcv, effectiveGcvDate)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Download contract
              </button>
            </Card>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Connection status</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">Comment on connection status</h3>
              <p className="mt-1 text-sm text-slate-500">Post a comment or status update for this customer's connection - it syncs live to their Connection Status page in the Industrial Customer Portal.</p>
            </div>
            <CustomerCollaborationPanel
              customerKey={selectedCustomer.contractNumber}
              customerName={selectedCustomer.name}
              viewerLabel="Marketing"
              authorName="Marketing Operator"
            />
          </>
        )}
      </Drawer>
    </div>
  );
}

export default ExistingCustomers;