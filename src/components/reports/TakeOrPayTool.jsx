import React, { useMemo, useState } from 'react';
import { CheckCircle2, ListChecks, XCircle } from 'lucide-react';
import Card from '../common/Card';

function round2(value) {
  return Math.round(value * 100) / 100;
}

/* Interactive Take-or-Pay (MGO) compliance simulator: exclude flagged shut-down days and recalculate the average off-take */
function TakeOrPayTool({ takeOrPay }) {
  const { series, quota, minimumObligation } = takeOrPay;
  const eligibleDays = useMemo(() => series.filter((day) => day.nonOperational), [series]);
  const [selected, setSelected] = useState([]);

  const remainingQuota = quota.annualQuotaDays - quota.usedDaysYTD;
  const baseAverage = useMemo(() => round2(series.reduce((sum, day) => sum + day.mmbtu, 0) / series.length), [series]);

  const revised = useMemo(() => {
    if (selected.length === 0) return null;
    const remaining = series.filter((day) => !selected.includes(day.date));
    if (remaining.length === 0) return null;
    const sum = remaining.reduce((acc, day) => acc + day.mmbtu, 0);
    return { average: round2(sum / remaining.length), days: remaining.length };
  }, [series, selected]);

  const toggleDay = (date) => {
    setSelected((current) => {
      if (current.includes(date)) return current.filter((d) => d !== date);
      if (current.length >= remainingQuota) return current;
      return [...current, date];
    });
  };

  const baseCompliant = baseAverage >= minimumObligation;
  const revisedCompliant = revised ? revised.average >= minimumObligation : baseCompliant;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-blue-950">Take-or-Pay (MGO) Compliance Simulator</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Exclude non-operational / low-draw days from your annual shut-down allowance to recalculate the average daily off-take against
        the {minimumObligation.toFixed(2)} MMBTU minimum obligation.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3 text-xs">
          <p className="text-slate-500">Annual Shut-down Day Quota</p>
          <p className="mt-1 font-semibold text-slate-800">
            {quota.usedDaysYTD} used of {quota.annualQuotaDays} days ({remainingQuota} remaining)
          </p>
        </div>
        <div className={`rounded-lg p-3 text-xs ${baseCompliant ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <p className={baseCompliant ? 'text-emerald-700' : 'text-rose-700'}>Current Average Off-take (all {series.length} days)</p>
          <p className={`mt-1 font-semibold ${baseCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>{baseAverage.toFixed(2)} MMBTU/day</p>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold text-slate-600">Eligible non-operational days ({eligibleDays.length})</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {eligibleDays.map((day) => {
            const checked = selected.includes(day.date);
            const disabled = !checked && selected.length >= remainingQuota;
            return (
              <label
                key={day.date}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  checked ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleDay(day.date)} className="sr-only" />
                {day.date} · {day.mmbtu.toFixed(2)} MMBTU
              </label>
            );
          })}
          {eligibleDays.length === 0 && <p className="text-xs text-slate-400">No non-operational days flagged in this cycle.</p>}
        </div>
      </fieldset>

      {selected.length > 0 && revised && (
        <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${revisedCompliant ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          {revisedCompliant ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          )}
          <div className="text-sm">
            <p className={`font-semibold ${revisedCompliant ? 'text-emerald-800' : 'text-rose-800'}`}>
              Revised average: {revised.average.toFixed(2)} MMBTU/day over {revised.days} day(s)
            </p>
            <p className={`mt-0.5 text-xs ${revisedCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
              {revisedCompliant
                ? `Minimum obligation of ${minimumObligation.toFixed(2)} MMBTU/day is met after excluding ${selected.length} non-operational day(s).`
                : `Still below the ${minimumObligation.toFixed(2)} MMBTU/day minimum obligation - further action required.`}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default TakeOrPayTool;
