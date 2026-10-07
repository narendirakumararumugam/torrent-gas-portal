import React, { useMemo, useState } from 'react';
import { BellRing, ChevronRight, Search, ShieldCheck, Target, Users } from 'lucide-react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import CustomerDetailView from './CustomerDetailView';
import { CUSTOMERS } from '../data/existing-customers.data.js';
import { downloadCustomerContract } from '../utils/customerContracts';
import { buildCustomerProfiles, DEFAULT_EFFECTIVE_GCV_DATE, MASTER_GCV_DEFAULT } from '../utils/customerCommunications';

function isCommissioned(customer) {
  return customer.contractStatus === 'Active' || customer.contractStatus === 'Expiring soon';
}

function customerStatusLabel(customer) {
  return isCommissioned(customer) ? 'Commissioned' : 'Agreement Signed - Yet to Commission';
}

function ExistingCustomers({ onShowToast }) {
  const toast = onShowToast ?? (() => {});
  const masterGcv = MASTER_GCV_DEFAULT;
  const effectiveGcvDate = DEFAULT_EFFECTIVE_GCV_DATE;
  const customers = useMemo(() => buildCustomerProfiles(masterGcv), [masterGcv]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const openCustomerDetail = (customerId) => {
    setSelectedCustomerId(customerId);
  };

  const { totalCustomers, commissionedCustomers, renewalAttention, expiringSoon } = useMemo(
    () => ({
      totalCustomers: customers.length,
      commissionedCustomers: customers.filter(isCommissioned).length,
      renewalAttention: customers.filter((customer) => customer.contractStatus === 'Renewal due').length,
      expiringSoon: customers.filter((customer) => customer.contractStatus === 'Expiring soon').length,
    }),
    [customers],
  );

  const allIndustries = useMemo(() => [...new Set(CUSTOMERS.map((customer) => customer.industry))], []);
  const allLocations = useMemo(() => [...new Set(CUSTOMERS.map((customer) => customer.location))], []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter(
        (customer) =>
          (!query || [customer.name, customer.id, customer.contractNumber, customer.email, customer.phone, customer.address, customer.contact, customer.designation].some((value) => value.toLowerCase().includes(query))) &&
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

  const openCustomerList = () => {
    setSelectedCustomerId(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Existing Customers"
        description="Customer relationships and contract summaries in one workspace. Communication workflows live in Customer Communications."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Customers', totalCustomers, <Users className="h-5 w-5 text-sky-600" />],
          ['Commissioned Customers', commissionedCustomers, <ShieldCheck className="h-5 w-5 text-emerald-600" />],
          ['Renewal Attention', renewalAttention, <Target className="h-5 w-5 text-amber-600" />],
          ['Expiring Soon', expiringSoon, <BellRing className="h-5 w-5 text-rose-600" />],
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

      {!selectedCustomer && (
        <>
          <Card className="p-5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, ID, contract, contact, email or phone"
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
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Customer Status</th>
                    <th className="px-5 py-3.5">Agreement Expiry</th>
                    <th className="px-5 py-3.5">Daily SCM</th>
                    <th className="px-5 py-3.5">Payment Status</th>
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
                          {customer.currentConsumption > 0 ? `${customer.currentConsumption.toLocaleString()} SCM` : <span className="font-normal text-slate-400">0 SCM</span>}
                        </td>
                        <td className="px-5 py-3.5 align-top text-slate-700">
                          {customer.paymentStatus}
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
                      <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">No customer profiles match the selected filters.</td>
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
        </>
      )}

      {selectedCustomer && (
        <CustomerDetailView
          customer={selectedCustomer}
          masterGcv={masterGcv}
          effectiveGcvDate={effectiveGcvDate}
          onBack={openCustomerList}
          onDownloadContract={(customer) => {
            const dailyConsumption = customer.currentConsumption ?? 0;
            const mmbtuValue = Number(((dailyConsumption * masterGcv) / 252000).toFixed(2));
            const expandedCustomer = { ...customer, scdValue: dailyConsumption, mmbtuValue };
            downloadCustomerContract(expandedCustomer, masterGcv, effectiveGcvDate);
          }}
          onShowToast={toast}
        />
      )}
    </div>
  );
}

export default ExistingCustomers;