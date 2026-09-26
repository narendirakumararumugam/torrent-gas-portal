import React from 'react';
import { statusLabels, statusStyles } from '../../utils/statusStyles';

function Badge({ tone, uppercase = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${uppercase ? 'tracking-wide uppercase' : ''} ${
        statusStyles[tone] || statusStyles.pending
      }`}
    >
      {tone === 'active' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />}
      {children ?? statusLabels[tone] ?? tone}
    </span>
  );
}

export default Badge;
