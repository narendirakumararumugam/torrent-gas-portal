import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import Card from '../common/Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

function PaymentDelayChart({ ledger }) {
  const data = {
    labels: ledger.map((cycle) => cycle.label),
    datasets: [
      {
        label: 'Delay Beyond 5 Business Days',
        data: ledger.map((cycle) => cycle.extraDelayDays),
        backgroundColor: ledger.map((cycle) => (cycle.extraDelayDays > 0 ? '#dc2626' : '#059669')),
        borderRadius: 4,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (item) => (item.raw > 0 ? `${item.raw} day(s) delayed` : 'On-time') } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, precision: 0 } },
    },
  };

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-blue-950">Payment Delay Distribution</p>
      <p className="text-xs text-slate-500">Days delayed beyond the standard 5 business day grace period</p>
      <div className="mt-4" style={{ height: 280 }}>
        <Bar data={data} options={options} />
      </div>
    </Card>
  );
}

export default PaymentDelayChart;
