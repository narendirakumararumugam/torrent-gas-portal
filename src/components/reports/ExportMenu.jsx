import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileImage, FileSpreadsheet, FileText } from 'lucide-react';

/* Accessible export dropdown: role="menu", Escape/outside-click to close */
function ExportMenu({ onExportCsv, onExportPng, onExportPdf }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const options = [
    onExportCsv && { key: 'csv', label: 'Export CSV (table)', icon: FileSpreadsheet, handler: onExportCsv },
    onExportPng && { key: 'png', label: 'Export PNG (chart)', icon: FileImage, handler: onExportPng },
    onExportPdf && { key: 'pdf', label: 'Export PDF (full report)', icon: FileText, handler: onExportPdf },
  ].filter(Boolean);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label="Export options" className="absolute right-0 z-10 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                option.handler();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <option.icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
