import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Mail, Phone, Search } from 'lucide-react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import { faqEntries } from '../data/faqs';
import { nodalContacts } from '../data/contacts';

function SupportCenter() {
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = faqEntries.filter((faq) => faq.question.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Help" title="Support Center" description="Emergency hotline, nodal contacts, and answers to frequently asked questions." />

      <div className="flex flex-col items-start gap-4 rounded-xl bg-rose-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-100">24/7 Emergency Hotline</p>
            <p className="text-xl font-bold">1800-266-0000</p>
          </div>
        </div>
        <a href="tel:18002660000" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
          Call Now
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {nodalContacts.map((contact) => (
          <Card key={contact.name} className="p-5">
            <h3 className="text-sm font-semibold text-slate-900">{contact.name}</h3>
            <p className="text-xs text-slate-500">{contact.role}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-emerald-600" />{contact.phone}</div>
              <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-emerald-600" />{contact.email}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900">Frequently Asked Questions</h3>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search FAQs..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-emerald-600"
          />
        </div>
        <div className="mt-4 space-y-2">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800"
                >
                  {faq.question}
                  <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">{faq.answer}</p>}
              </div>
            );
          })}
          {filteredFaqs.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No FAQ matches found.</p>}
        </div>
      </Card>
    </div>
  );
}

export default SupportCenter;
