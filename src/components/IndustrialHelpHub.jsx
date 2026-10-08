import React, { useState } from 'react';
import { ClipboardList, HelpCircle, MessageSquareMore, Phone } from 'lucide-react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import SupportCenter from './SupportCenter';
import ComplaintDesk from './ComplaintDesk';
import ServiceRequests from './ServiceRequests';

function IndustrialHelpHub({ onSubmitComplaint, onSubmitServiceRequest }) {
  const [activeSection, setActiveSection] = useState('help');

  const sections = [
    { key: 'help', label: 'Help', icon: HelpCircle },
    { key: 'complaint', label: 'Complaint', icon: MessageSquareMore },
    { key: 'service', label: 'Service Request', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Support"
        title="Register Complaint / Help"
        description="One industrial support area for FAQs, complaint registration, and service requests."
        action={
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Key Account Manager</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">Vinesh</p>
            </div>
            <a
              href="tel:18002660022"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              Call
            </a>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 pt-4 sm:px-5">
          {sections.map((section) => {
            const active = activeSection === section.key;
            const Icon = section.icon;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`inline-flex items-center gap-2 rounded-t-xl border px-3 py-2 text-sm font-semibold transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {section.label}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-5 sm:px-5">
          {activeSection === 'help' && <SupportCenter />}
          {activeSection === 'complaint' && <ComplaintDesk onSubmit={onSubmitComplaint} />}
          {activeSection === 'service' && <ServiceRequests onSubmit={onSubmitServiceRequest} />}
        </div>
      </Card>
    </div>
  );
}

export default IndustrialHelpHub;