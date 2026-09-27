import React, { useMemo, useState } from 'react';
import { Layers, Printer, TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';
import { TARIFF_HISTORY_DATA } from '../data/tariffHistoryData';
import { tariffSlabs } from '../data/tariffs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Legend, Tooltip);

const currentBillingCycleLabel = 'Sep-26 FN2';

function formatMoney(value) {
  return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculateScmPrice(mmbtu) {
  return (mmbtu * 9300) / 252000;
}

function TariffBoard({ showHeading = true }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');

  const latestRecord = TARIFF_HISTORY_DATA[TARIFF_HISTORY_DATA.length - 1];

  const kpis = useMemo(() => {
    const mgoScm = calculateScmPrice(latestRecord.mgo);
    const nonMgoScm = calculateScmPrice(latestRecord.nonMgo);
    const excessScm = calculateScmPrice(latestRecord.excess);

    return [
      {
        title: 'MGO Price',
        mmbtuValue: formatMoney(latestRecord.mgo),
        scmValue: formatMoney(mgoScm),
        sub: `Effective (${currentBillingCycleLabel})`,
        isGreen: true,
      },
      {
        title: 'Non-MGO Price',
        mmbtuValue: formatMoney(latestRecord.nonMgo),
        scmValue: formatMoney(nonMgoScm),
        sub: `Effective (${currentBillingCycleLabel})`,
        isGreen: false,
      },
      {
        title: 'Excess Price',
        mmbtuValue: formatMoney(latestRecord.excess),
        scmValue: formatMoney(excessScm),
        sub: `Effective (${currentBillingCycleLabel})`,
        isGreen: false,
      },
    ];
  }, [latestRecord]);

  const filteredData = useMemo(() => {
    const totalRecords = TARIFF_HISTORY_DATA.length;

    switch (selectedTimeframe) {
      case '6m':
        return TARIFF_HISTORY_DATA.slice(totalRecords - 6);
      case '1y':
        return TARIFF_HISTORY_DATA.slice(totalRecords - 12);
      case '2y':
        return TARIFF_HISTORY_DATA.slice(totalRecords - 24);
      default:
        return TARIFF_HISTORY_DATA;
    }
  }, [selectedTimeframe]);

  const chartData = useMemo(() => ({
    labels: filteredData.map((item) => item.period),
    datasets: [
      {
        label: 'MGO Price (₹/MMBTU)',
        data: filteredData.map((item) => item.mgo),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2.5,
        pointRadius: 3,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Non-MGO Price (₹/MMBTU)',
        data: filteredData.map((item) => item.nonMgo),
        borderColor: '#0A2540',
        backgroundColor: 'rgba(10, 37, 64, 0.05)',
        borderWidth: 2.5,
        pointRadius: 3,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Excess Price (₹/MMBTU)',
        data: filteredData.map((item) => item.excess),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2.5,
        pointRadius: 3,
        fill: false,
        tension: 0.3,
      },
    ],
  }), [filteredData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        title: { display: true, text: '₹ / MMBTU' },
      },
    },
  }), []);

  const exportReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {showHeading && (
        <SectionHeading
          eyebrow="Pricing"
          title={`Current Billing Cycle Pricing (${currentBillingCycleLabel})`}
          description="Active tariff rates, slab structure, and historical trend for the current active month."
          action={
            <button
              type="button"
              onClick={exportReport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print / Export
            </button>
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={`p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${kpi.isGreen ? 'border-emerald-200' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{kpi.title}</p>
                <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
              </div>
              <div className={`rounded-2xl p-2.5 ${kpi.isGreen ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <TrendingUp className={`h-5 w-5 ${kpi.isGreen ? 'text-emerald-600' : 'text-slate-500'}`} />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Primary Rate</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{kpi.mmbtuValue}</p>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">per MMBTU</p>
              </div>

              <div className="hidden h-12 w-px self-center bg-slate-100 sm:block" />

              <div className="sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Equivalent Rate @9880 KCal/SCM</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-800">{kpi.scmValue}</p>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">per SCM</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">PNG Price Trend (₹ / MMBTU)</h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Timeline:</label>
            <select
              value={selectedTimeframe}
              onChange={(event) => setSelectedTimeframe(event.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
              <option value="2y">Last 2 Years</option>
            </select>
          </div>
        </div>

        <div className="mt-4 h-[310px] w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>

      <Card className="p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Tariff Structure</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Slab-Wise Rates &amp; Penalties</h3>
          </div>
          <Layers className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tariffSlabs.map((slab) => (
            <div key={slab.tier} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{slab.tier}</p>
              <p className="mt-1 text-xs text-slate-500">{slab.pressure}</p>
              <p className="mt-3 text-xl font-bold text-slate-900">{slab.rate}</p>
              <p className="mt-1 text-xs text-slate-500">{slab.taxes}</p>
              <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">{slab.penalty}</div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{slab.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default TariffBoard;
