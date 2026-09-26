import React from 'react';
import { Activity, BellRing, FileText, Gauge, MessageSquareText, ShieldCheck, UserRound } from 'lucide-react';
import Card from '../common/Card';
import CustomerCollaborationPanel from '../common/CustomerCollaborationPanel';

function Metric({ icon: Icon, label, value, detail, tone = 'text-slate-900' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
        </div>
        <Icon className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </Card>
  );
}

function CustomerPortalPreview({ customer }) {
  if (!customer) {
    return null;
  }

  const portalHealth = customer.contractStatus === 'Active' ? 'Healthy' : customer.contractStatus === 'Expiring soon' ? 'Watch' : 'Needs attention';
  const billSignal = customer.talentValue > 0 ? Math.max(72, Math.min(97, customer.engagementScore + 6)) : customer.engagementScore;
  const commsMode = customer.dailyCommunication ? 'Daily dispatch enabled' : 'Manual updates only';

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-5 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Embedded customer portal</p>
            <h3 className="mt-2 text-2xl font-semibold">{customer.name}</h3>
            <p className="mt-1 text-sm text-slate-300">Contract {customer.contractNumber} · {customer.industry} · {customer.location}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Portal status</p>
            <p className="mt-1 text-lg font-semibold text-white">{portalHealth}</p>
            <p className="mt-1 text-xs text-slate-300">Mirrors the customer-facing login experience.</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={UserRound}
            label="Account status"
            value={customer.contractStatus}
            detail={`Renewal due date ${customer.expiry}. Selected account is ${portalHealth.toLowerCase()}.`}
          />
          <Metric
            icon={Gauge}
            label="Consumption snapshot"
            value={`${customer.scdValue.toLocaleString()} SCM`}
            detail={`${customer.mmbtuValue} MMBTU equivalent under the active master GCV model.`}
            tone="text-slate-900"
          />
          <Metric
            icon={Activity}
            label="Engagement signal"
            value={`${customer.engagementScore}%`}
            detail="Measures how likely the customer is to act on operational and commercial notifications."
          />
          <Metric
            icon={ShieldCheck}
            label="Communication mode"
            value={customer.dailyCommunication ? 'Daily' : 'Manual'}
            detail={commsMode}
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
          <Card className="border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Real-time status dashboard</p>
                <p className="text-xs text-slate-500">This mirrors the dashboard the customer sees after login.</p>
              </div>
              <BellRing className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Last campaign</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{customer.lastCampaign}</p>
                <p className="mt-1 text-xs text-slate-500">Outcome: {customer.campaignOutcome}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Last touch</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{customer.lastTouchDate}</p>
                <p className="mt-1 text-xs text-slate-500">Preferred channel: {customer.preferredChannel}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Current bill signal</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{billSignal}%</p>
                <p className="mt-1 text-xs text-slate-500">Proxy for how urgent the customer views the present cycle.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Active notices</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Live thread enabled</p>
                <p className="mt-1 text-xs text-slate-500">Operator comments and customer replies sync instantly.</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Customer-visible message</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    {customer.dailyCommunication
                      ? 'Your account is receiving daily operational updates. Any marketing note posted here will show up in the customer dashboard immediately.'
                      : 'The account is not on daily dispatch. Shared notes and status changes remain visible in the customer dashboard and operator console.'}
                  </p>
                </div>
                <MessageSquareText className="h-4.5 w-4.5 text-emerald-700" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Quick account facts</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="text-slate-500">DCQ</span>
                  <span className="font-semibold text-slate-900">{customer.dcq.toLocaleString()} SCM</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900">{customer.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-semibold text-slate-900">{customer.phone}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="text-slate-500">Engagement</span>
                  <span className="font-semibold text-slate-900">{customer.engagementScore}%</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Customer portal note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This embedded view is the operator-side mirror of the customer portal. The shared live thread below is the same data stream used by the customer dashboard.
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-4">
          <CustomerCollaborationPanel
            customerKey={customer.contractNumber}
            customerName={customer.name}
            viewerLabel="Operator"
            authorName="Marketing Operator"
          />
        </div>
      </div>
    </Card>
  );
}

export default CustomerPortalPreview;