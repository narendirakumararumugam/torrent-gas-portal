import React, { useState } from 'react';
import { LayoutDashboard, LayoutGrid, Lightbulb, Table2 } from 'lucide-react';
import Card from '../common/Card';
import StatStrip from './StatStrip';
import AnomalyRibbon from './AnomalyRibbon';
import ReportChart from './ReportChart';
import DrillDownTable from './DrillDownTable';
import SmartInsight from './SmartInsight';
import CommercialMultiChartDashboard from './CommercialMultiChartDashboard';

const tabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'table', label: 'Data Table', icon: Table2 },
  { key: 'insights', label: 'Insights', icon: Lightbulb },
  { key: 'multichart', label: 'Multi-Chart', icon: LayoutGrid },
];

function CommercialReportContentTabs({ selectedTemplate, result, isCombined, chartRef, reportParams, onShowToast, unit }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={active ? 'true' : undefined}
              className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition ${active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <StatStrip stats={result.stats} unit={unit} />
          <AnomalyRibbon anomalies={result.anomalies} />
          <Card className="p-5">
            {isCombined && <p className="mb-2 text-xs font-medium text-slate-400">Combined view - switch to "Per Meter" for individual lines.</p>}
            <ReportChart ref={chartRef} chartType={result.chartType} labels={result.labels} series={result.series} compareSeries={result.compareSeries} />
          </Card>
        </div>
      )}

      {activeTab === 'table' && (
        <DrillDownTable table={result.table} filename={`${selectedTemplate.name.replace(/\s+/g, '_').toLowerCase()}_data.csv`} />
      )}

      {activeTab === 'insights' && <SmartInsight insights={result.insights} />}

      {activeTab === 'multichart' && (
        <CommercialMultiChartDashboard
          key={selectedTemplate.reportId}
          storageKey={`report-layout-${selectedTemplate.reportId}`}
          baseParams={reportParams}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}

export default CommercialReportContentTabs;