import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import Card from '../common/Card';
import { exportTableCsv } from '../../utils/csvExport';

const PAGE_SIZE = 8;

/* Raw-rows drill-down table with client-side pagination + CSV export */
function DrillDownTable({ table, filename }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(table.rows.length / PAGE_SIZE));
  const pageRows = useMemo(() => table.rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [table.rows, page]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-900">Drill-Down Data</p>
        <button
          type="button"
          onClick={() => exportTableCsv(filename, table.columns, table.rows)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {table.columns.map((col) => (
                <th key={col} scope="col" className="px-5 py-2.5 font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="transition hover:bg-slate-50">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-5 py-2.5 text-slate-600">{typeof cell === 'number' ? cell.toLocaleString('en-IN') : cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
        <span>Page {page + 1} of {totalPages} · {table.rows.length} rows</span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            Previous
          </button>
          <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </Card>
  );
}

export default DrillDownTable;
