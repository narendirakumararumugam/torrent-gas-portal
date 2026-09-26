import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import Card from '../common/Card';
import { formatINR } from '../../utils/billingEngine';

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

function BillingHistoryChart({ cycles }) {
  const data = {
    labels: cycles.map((cycle) => cycle.label),
    datasets: [
      { label: 'Invoiced', data: cycles.map((cycle) => cycle.invoiced), backgroundColor: '#f97316', borderRadius: 4, maxBarThickness: 28 },
      { label: 'Paid', data: cycles.map((cycle) => cycle.paid), backgroundColor: '#1e3a8a', borderRadius: 4, maxBarThickness: 28 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 11 } } },
      tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${formatINR(item.raw)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, callback: (value) => `₹${(value / 1000).toFixed(0)}k` } },
    },
  };

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-blue-950">Billing vs Payment History</p>
      <p className="text-xs text-slate-500">Last 5 fortnightly cycles</p>
      <div className="mt-4" style={{ height: 280 }}>
        <Bar data={data} options={options} />
      </div>
    </Card>
  );
}

export default BillingHistoryChart;
