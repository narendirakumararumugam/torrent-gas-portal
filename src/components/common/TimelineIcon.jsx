import React from 'react';

const toneClasses = {
  completed: 'bg-emerald-500 text-white ring-4 ring-emerald-50',
  active: 'bg-orange-500 text-white ring-4 ring-orange-50 animate-pulse',
  upcoming: 'bg-slate-200 text-slate-500 ring-4 ring-slate-50',
};

/* 40px timeline node; supports a small secondary badge icon layered on the primary icon */
function TimelineIcon({ Icon, SecondaryIcon, status }) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClasses[status] || toneClasses.upcoming}`}>
      <Icon className="h-4.5 w-4.5" />
      {SecondaryIcon && (
        <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
          <SecondaryIcon className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  );
}

export default TimelineIcon;
