import React, { useMemo, useRef, useState } from 'react';
import { Bug, CalendarClock, Menu, Sparkles } from 'lucide-react';
import SectionHeading from './common/SectionHeading';
import Card from './common/Card';
import TemplatesSidebar from './reports/TemplatesSidebar';
import FilterBar from './reports/FilterBar';
import StatStrip from './reports/StatStrip';
import ReportChart from './reports/ReportChart';
import AnomalyRibbon from './reports/AnomalyRibbon';
import DrillDownTable from './reports/DrillDownTable';
import SmartInsight from './reports/SmartInsight';
import ExportMenu from './reports/ExportMenu';
import ScheduleModal from './reports/ScheduleModal';
import CustomReportBuilder from './reports/CustomReportBuilder';
import MultiChartDashboard from './reports/MultiChartDashboard';
import ProductionAnalysisPanel from './reports/ProductionAnalysisPanel';
import PersonaBasedDashboards from './reports/PersonaBasedDashboards';
import { ReportEmptyState, ReportErrorState, ReportLoadingState } from './reports/ReportsStates';
import { reportTemplates as baseTemplates, reportRunHistory } from '../data/reportTemplates';
import { useReportRun } from '../hooks/useReportRun';
import { exportTableCsv } from '../utils/csvExport';
import { downloadDataUrl } from '../utils/download';

function defaultFiltersFor(template) {
  return {
    preset: template.params.preset || 'custom',
    from: template.params.from || '2026-08-01',
    to: template.params.to || '2026-09-23',
    granularity: template.params.granularity || 'daily',
    meterIds: template.params.meterIds || template.params.meters || ['MTR-1'],
    aggregation: 'separate',
    compareTo: template.params.compareTo || null,
    simulationMode: template.params.simulationMode || 'historical',
    balanceStrength: template.params.balanceStrength ?? 45,
  };
}

function ReportsHub({ onDownload, onShowToast, audience = 'customer' }) {
  const [templates, setTemplates] = useState(baseTemplates.filter((t) => t.audience === 'both' || t.audience === audience));
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [filters, setFilters] = useState(() => defaultFiltersFor(templates[0]));
  const [category, setCategory] = useState('All');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showMultiChart, setShowMultiChart] = useState(false);
  const chartRef = useRef(null);

  const reportParams = useMemo(
    () => ({
      from: filters.from,
      to: filters.to,
      granularity: filters.granularity,
      meterIds: filters.meterIds,
      aggregation: filters.aggregation,
      compareTo: filters.compareTo,
      simulationMode: filters.simulationMode,
      balanceStrength: filters.balanceStrength,
    }),
    [filters],
  );

  const { status, result, retry, simulateError } = useReportRun(selectedTemplate.type, reportParams);
  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setFilters(defaultFiltersFor(template));
    setMobileNavOpen(false);
  };

  const handleGenerateCustom = (customTemplate) => {
    setTemplates((current) => [customTemplate, ...current]);
    setBuilderOpen(false);
    selectTemplate(customTemplate);
    onShowToast(`Custom report "${customTemplate.name}" generated`);
  };

  const handleSaveSchedule = (cron, recipients) => {
    setTemplates((current) => current.map((t) => (t.reportId === selectedTemplate.reportId ? { ...t, scheduledCron: cron } : t)));
    setScheduleOpen(false);
    onShowToast(`Schedule saved - ${recipients.length} recipient${recipients.length === 1 ? '' : 's'} will receive "${selectedTemplate.name}"`);
  };

  const handleExportCsv = () => {
    if (!result) return;
    exportTableCsv(`${selectedTemplate.name.replace(/\s+/g, '_').toLowerCase()}.csv`, result.table.columns, result.table.rows);
  };

  const handleExportPng = () => {
    if (!chartRef.current) return;
    downloadDataUrl(`${selectedTemplate.name.replace(/\s+/g, '_').toLowerCase()}.png`, chartRef.current.toBase64Image());
  };

  const handleExportPdf = () => {
    if (!result) return;
    onDownload(
      selectedTemplate.name,
      'PDF',
    );
  };

  const isCombined = filters.meterIds.length > 1 && selectedTemplate.type === 'consumption_timeseries';
  const isProductionAnalysis = selectedTemplate.type === 'production_analysis';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading
          eyebrow="Analytics"
          title="Reports Hub"
          description="Generate, filter, and schedule operational, tariff, and financial reports."
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileNavOpen((current) => !current)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            <Menu className="h-3.5 w-3.5" aria-hidden="true" />
            Saved Reports
          </button>
          <button
            type="button"
            onClick={() => setBuilderOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            New Report
          </button>
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            Schedule
          </button>
        </div>
      </div>

      <PersonaBasedDashboards />

      {mobileNavOpen && (
        <Card className="p-4 lg:hidden">
          <TemplatesSidebar
            templates={templates}
            activeReportId={selectedTemplate.reportId}
            onSelect={selectTemplate}
            category={category}
            onCategoryChange={setCategory}
            onNewCustomReport={() => setBuilderOpen(true)}
          />
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[220px_1fr_280px]">
        <Card className="hidden p-4 lg:block">
          <TemplatesSidebar
            templates={templates}
            activeReportId={selectedTemplate.reportId}
            onSelect={selectTemplate}
            category={category}
            onCategoryChange={setCategory}
            onNewCustomReport={() => setBuilderOpen(true)}
          />
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedTemplate.name}</h3>
              <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={simulateError}
                title="Demo only: simulate a failed report run"
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-rose-300 hover:text-rose-600"
              >
                <Bug className="h-3.5 w-3.5" aria-hidden="true" />
                Simulate Error
              </button>
              <ExportMenu onExportCsv={result ? handleExportCsv : null} onExportPng={result ? handleExportPng : null} onExportPdf={result ? handleExportPdf : null} />
            </div>
          </div>

          {!isProductionAnalysis && <FilterBar filters={filters} onChange={setFilters} showAggregation={selectedTemplate.type === 'consumption_timeseries'} />}

          {status === 'loading' && <ReportLoadingState />}
          {status === 'error' && <ReportErrorState onRetry={retry} />}
          {status === 'ready' && result && result.labels.length === 0 && <ReportEmptyState />}

          {status === 'ready' && result && result.labels.length > 0 && (
            <>
              {isProductionAnalysis ? (
                <ProductionAnalysisPanel result={result} filters={filters} onChangeFilters={setFilters} chartRef={chartRef} />
              ) : (
                <>
                  <StatStrip stats={result.stats} unit={selectedTemplate.type === 'revenue_receivables' || selectedTemplate.type === 'tariff_impact' ? 'INR' : 'SCM'} />
                  <AnomalyRibbon anomalies={result.anomalies} />
                  <Card className="p-5">
                    {isCombined && <p className="mb-2 text-xs font-medium text-slate-400">Combined view - switch to "Per Meter" for individual lines.</p>}
                    <ReportChart ref={chartRef} chartType={result.chartType} labels={result.labels} series={result.series} compareSeries={result.compareSeries} />
                  </Card>
                  <DrillDownTable table={result.table} filename={`${selectedTemplate.name.replace(/\s+/g, '_').toLowerCase()}_data.csv`} />

                  <button
                    type="button"
                    onClick={() => setShowMultiChart((current) => !current)}
                    className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {showMultiChart ? 'Hide' : 'Show'} multi-chart dashboard
                  </button>
                  {showMultiChart && (
                    <MultiChartDashboard
                      key={selectedTemplate.reportId}
                      storageKey={`report-layout-${selectedTemplate.reportId}`}
                      baseParams={reportParams}
                      onShowToast={onShowToast}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="hidden lg:block">{result && !isProductionAnalysis && <SmartInsight insights={result.insights} />}</div>
      </div>

      {result && !isProductionAnalysis && (
        <div className="lg:hidden">
          <SmartInsight insights={result.insights} />
        </div>
      )}

      {scheduleOpen && (
        <ScheduleModal
          template={selectedTemplate}
          runHistory={reportRunHistory[selectedTemplate.reportId] || []}
          onClose={() => setScheduleOpen(false)}
          onSave={handleSaveSchedule}
        />
      )}

      {builderOpen && <CustomReportBuilder onClose={() => setBuilderOpen(false)} onGenerate={handleGenerateCustom} />}
    </div>
  );
}

export default ReportsHub;
