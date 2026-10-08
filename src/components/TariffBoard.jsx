import React, { useMemo, useState } from 'react';
import { Printer, TrendingUp } from 'lucide-react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Legend, Tooltip);

const currentBillingCycleLabel = 'Oct-26 FN1';

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
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 18,
          font: { size: 11 },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 11 } },
        title: { display: true, text: '₹ / MMBTU', color: '#64748b', font: { size: 11, weight: '600' } },
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
          action={
            <button
              type="button"
              onClick={exportReport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print / Export
            </button>
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={`p-5 transition hover:shadow-md ${kpi.isGreen ? 'border-emerald-200' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.isGreen ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <TrendingUp className={`h-4.5 w-4.5 ${kpi.isGreen ? 'text-emerald-600' : 'text-slate-500'}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{kpi.title}</p>
                <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Primary Rate</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-blue-950">{kpi.mmbtuValue}</p>
                <p className="text-xs text-slate-500">per MMBTU</p>
              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">Equivalent Rate @ 9880 KCal/SCM</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-slate-800">{kpi.scmValue}</p>
                <p className="text-xs text-slate-500">per SCM</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Historical Trend</p>
            <h3 className="mt-1 text-xl font-semibold text-blue-950">PNG Price Trend</h3>
            <p className="mt-1 text-sm text-slate-500">A time series view of the active billing cycle benchmark.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Timeline</label>
            <select
              value={selectedTimeframe}
              onChange={(event) => setSelectedTimeframe(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
            >
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
              <option value="2y">Last 2 Years</option>
            </select>
          </div>
        </div>

        <div className="mt-5 h-[300px] w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
}

export default TariffBoard;
