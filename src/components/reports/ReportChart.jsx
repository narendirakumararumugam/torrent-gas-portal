import React, { forwardRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Legend, Tooltip);

const palette = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

/* Chart.js wrapper - handles anomaly point highlighting and a "previous period" compare overlay */
const ReportChart = forwardRef(function ReportChart({ chartType = 'line', labels, series, compareSeries, stacked = false, height = 280 }, ref) {
  const datasets = series.map((s, index) => {
    const color = palette[index % palette.length];
    const base = {
      label: s.label,
      data: s.data,
      borderColor: color,
      backgroundColor: chartType === 'bar' ? `${color}cc` : `${color}22`,
      borderDash: s.dashed ? [6, 4] : undefined,
      tension: 0.35,
      fill: chartType === 'line' && !s.dashed,
      pointRadius: s.anomalies ? s.anomalies.map((flag) => (flag ? 6 : 2)) : 2,
      pointBackgroundColor: s.anomalies ? s.anomalies.map((flag) => (flag ? '#e11d48' : color)) : color,
      pointBorderColor: s.anomalies ? s.anomalies.map((flag) => (flag ? '#e11d48' : color)) : color,
    };
    return base;
  });

  if (compareSeries) {
    datasets.push({
      label: 'Previous Period',
      data: compareSeries,
      borderColor: '#94a3b8',
      backgroundColor: 'transparent',
      borderDash: [4, 4],
      pointRadius: 0,
      tension: 0.35,
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 11 } } },
      tooltip: { callbacks: { footer: (items) => (items.some((i) => series[i.datasetIndex]?.anomalies?.[i.dataIndex]) ? 'Anomaly: exceeds expected range' : '') } },
    },
    scales: {
      x: { grid: { display: false }, stacked, ticks: { font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: { grid: { color: '#f1f5f9' }, stacked, ticks: { font: { size: 11 } } },
    },
  };

  const ChartComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div style={{ height }}>
      <ChartComponent ref={ref} data={{ labels, datasets }} options={options} />
    </div>
  );
});

export default ReportChart;
