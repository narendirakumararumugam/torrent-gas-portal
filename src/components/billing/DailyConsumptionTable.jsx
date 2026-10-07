import React from 'react';
import Card from '../common/Card';

function formatValue(value, fractionDigits = 3) {
  if (value === null || value === undefined) return '-';
  if (value === 0) return '-';
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function sum(values, key) {
  return values.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function DailyConsumptionTable({ rows, title = 'Daily Gas Consumption', subtitle = 'Billing cycle' }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-blue-950">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total Qty Consumed (SCM)</th>
              <th className="px-4 py-3 font-medium">GCV (Kcal/SCM)</th>
              <th className="px-4 py-3 font-medium">Total Qty (MMBTU) IV = I+II+III</th>
              <th className="px-4 py-3 font-medium">MGO Qty (MMBTU) I</th>
              <th className="px-4 py-3 font-medium">Non MGO Qty (MMBTU) II</th>
              <th className="px-4 py-3 font-medium">Excess Qty (MMBTU) III</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.date}>
                <td className="px-4 py-3 font-medium text-slate-800">{row.date}</td>
                <td className="px-4 py-3 text-slate-500">{formatValue(row.totalQtyScm)}</td>
                <td className="px-4 py-3 text-slate-500">{formatValue(row.gcv, 3)}</td>
                <td className="px-4 py-3 text-slate-800">{formatValue(row.totalMmbtu)}</td>
                <td className="px-4 py-3 text-slate-800">{formatValue(row.mgoQty)}</td>
                <td className="px-4 py-3 text-slate-800">{formatValue(row.nonMgoQty)}</td>
                <td className="px-4 py-3 text-slate-800">{formatValue(row.excessQty)}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 bg-slate-50/70 font-semibold text-slate-800">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3">{formatValue(sum(rows, 'totalQtyScm'))}</td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3">{formatValue(sum(rows, 'totalMmbtu'))}</td>
              <td className="px-4 py-3">{formatValue(sum(rows, 'mgoQty'))}</td>
              <td className="px-4 py-3">{formatValue(sum(rows, 'nonMgoQty'))}</td>
              <td className="px-4 py-3">{formatValue(sum(rows, 'excessQty'))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default DailyConsumptionTable;