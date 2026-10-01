import React, { useMemo, useRef, useState } from 'react';
import { Bug, CalendarClock } from 'lucide-react';
import SectionHeading from './common/SectionHeading';
import Card from './common/Card';
import ReportSelector from './reports/ReportSelector';
import FilterBar from './reports/FilterBar';
import ExportMenu from './reports/ExportMenu';
import ScheduleModal from './reports/ScheduleModal';
import CustomReportBuilder from './reports/CustomReportBuilder';
import CommercialReportContentTabs from './reports/CommercialReportContentTabs';
import { ReportEmptyState, ReportErrorState, ReportLoadingState } from './reports/ReportsStates';
import { reportTemplates as baseTemplates, reportRunHistory } from '../data/commercialReportTemplates';
import { useCommercialReportRun } from '../hooks/useCommercialReportRun';
import { exportTableCsv } from '../utils/csvExport';
import { downloadDataUrl } from '../utils/download';

const commercialReportOptions = [
  { value: 'consumption_timeseries', label: 'Consumption' },
  { value: 'flat_rate_billing', label: 'Flat Rate Billing' },
  { value: 'mgo_flowrate', label: 'Demand & Peak Flow' },
];

function defaultFiltersFor(template) {
  return {
    preset: template.params.preset || 'custom',
    from: template.params.from || '2026-09-16',
    to: template.params.to || '2026-09-30',
    granularity: template.params.granularity || 'daily',
    meterIds: template.params.meterIds || template.params.meters || ['CMTR-1'],
    aggregation: 'separate',
    compareTo: template.params.compareTo || null,
    simulationMode: template.params.simulationMode || 'historical',
    balanceStrength: template.params.balanceStrength ?? 45,
  };
}

function CommercialReportsHub({ onDownload, onShowToast }) {
  const [templates, setTemplates] = useState(baseTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [filters, setFilters] = useState(() => defaultFiltersFor(templates[0]));
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
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

  const { status, result, retry, simulateError } = useCommercialReportRun(selectedTemplate.type, reportParams);

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setFilters(defaultFiltersFor(template));
  };

  const handleGenerateCustom = (customTemplate) => {
    setTemplates((current) => [customTemplate, ...current]);
    setBuilderOpen(false);
    selectTemplate(customTemplate);
    onShowToast(`Custom report "${customTemplate.name}" generated`);
  };

  const handleSaveSchedule = (cron, recipients) => {
    setTemplates((current) => current.map((template) => (template.reportId === selectedTemplate.reportId ? { ...template, scheduledCron: cron } : template)));
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
    onDownload(selectedTemplate.name, 'PDF');
  };

  const isCombined = filters.meterIds.length > 1 && selectedTemplate.type === 'consumption_timeseries';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading eyebrow="Analytics" title="Reports Hub" description="Generate and schedule commercial usage, billing, and demand reports." />
        <button
          type="button"
          onClick={() => setScheduleOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Schedule
        </button>
      </div>

      <Card className="p-4">
        <ReportSelector templates={templates} activeReportId={selectedTemplate.reportId} onSelect={selectTemplate} onNewCustomReport={() => setBuilderOpen(true)} />
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

        <FilterBar filters={filters} onChange={setFilters} showAggregation={selectedTemplate.type === 'consumption_timeseries'} />

        {status === 'loading' && <ReportLoadingState />}
        {status === 'error' && <ReportErrorState onRetry={retry} />}
        {status === 'ready' && result && result.labels.length === 0 && <ReportEmptyState />}

        {status === 'ready' && result && result.labels.length > 0 && (
          <CommercialReportContentTabs
            selectedTemplate={selectedTemplate}
            result={result}
            isCombined={isCombined}
            chartRef={chartRef}
            reportParams={reportParams}
            onShowToast={onShowToast}
            unit={selectedTemplate.type === 'flat_rate_billing' ? 'INR' : 'SCM'}
          />
        )}
      </div>

      {scheduleOpen && (
        <ScheduleModal
          template={selectedTemplate}
          runHistory={reportRunHistory[selectedTemplate.reportId] || []}
          onClose={() => setScheduleOpen(false)}
          onSave={handleSaveSchedule}
        />
      )}

      {builderOpen && (
        <CustomReportBuilder
          focusOptions={commercialReportOptions}
          defaultFrom="2026-09-16"
          defaultTo="2026-09-30"
          onClose={() => setBuilderOpen(false)}
          onGenerate={handleGenerateCustom}
        />
      )}
    </div>
  );
}

export default CommercialReportsHub;