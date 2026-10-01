import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { formatINR } from '../../utils/billingFormat';

/* Navy "Download Tax Invoice" trigger - opens a menu to pick the fortnight before generating the PDF */
function InvoiceCycleMenu({ cycles, onSelect }) {
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

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download Tax Invoice
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select billing cycle"
          className="absolute left-0 z-20 mt-1.5 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
        >
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Select Billing Cycle</p>
          <div className="max-h-72 overflow-y-auto">
            {cycles.map((cycle) => (
              <button
                key={cycle.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSelect(cycle.id);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
              >
                <span>
                  <span className="block font-medium text-blue-950">
                    {cycle.monthLabel}
                  </span>
                  <span className="block text-xs text-slate-400">{cycle.label}</span>
                </span>
                <span className="whitespace-nowrap text-xs font-semibold text-slate-500">{formatINR(cycle.invoiced)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceCycleMenu;
