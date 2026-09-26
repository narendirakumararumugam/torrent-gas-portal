import React, { useMemo } from 'react';
import { CalendarClock, Layers, Sparkles, TrendingUp, Download } from 'lucide-react';
import Card from '../common/Card';
import SectionHeading from '../common/SectionHeading';
import TariffBoard from '../TariffBoard';
import { tariffRecords } from '../../data/tariffRecords';
import { generateDownload } from '../../utils/download';

function MarketingTariffRevision({ onShowToast }) {
  const showToast = onShowToast ?? (() => {});

  const revisions = useMemo(() => {
    const grouped = tariffRecords.reduce((accumulator, record) => {
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
  }, []);

  const latestRevision = revisions[0];
  const distinctSlabCount = useMemo(() => new Set(tariffRecords.map((record) => record.slab)).size, []);

  const exportRevisionNote = () => {
    const content = [
      'Marketing Tariff & Price Revision Note',
      `Latest effective date: ${latestRevision.effectiveDate}`,
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

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Tariff & Price Revision"
        description="Review the current tariff slab matrix and track revision history for pricing communication and approvals."
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
          ['Active revision date', latestRevision.effectiveDate, <CalendarClock className="h-5 w-5 text-emerald-600" />],
          ['Slabs tracked', distinctSlabCount, <Sparkles className="h-5 w-5 text-violet-600" />],
          ['Average rate', `INR ${latestRevision.averageRate} / SCM`, <TrendingUp className="h-5 w-5 text-sky-600" />],
          ['Revision cycles', revisions.length, <Layers className="h-5 w-5 text-amber-600" />],
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Current tariff slabs</h3>
              <p className="mt-1 text-sm text-slate-500">Industrial rate slabs divided by pressure and volume tiers.</p>
            </div>
          </div>
          <div className="mt-4">
            <TariffBoard showHeading={false} />
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
    </div>
  );
}

export default MarketingTariffRevision;
