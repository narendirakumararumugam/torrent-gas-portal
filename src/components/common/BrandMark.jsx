import React from 'react';

import torrentLogo from '../../../torrent.png';

function BrandMark({ className = '', imageClassName = '', textClassName = '', showText = true, compact = false }) {
  const sizeClass = compact ? 'h-8 w-8' : 'h-11 w-11';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex ${sizeClass} items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200`}>
        <img src={torrentLogo} alt="Torrent Gas" className={`h-full w-full object-contain ${imageClassName}`} />
      </div>
      {showText && (
        <div className="leading-tight">
          <p className={`text-sm font-semibold tracking-[0.18em] text-slate-500 ${textClassName}`}>TORRENT</p>
          <p className={`text-sm font-semibold tracking-[0.22em] text-emerald-600 ${textClassName}`}>GAS</p>
        </div>
      )}
    </div>
  );
}

export default BrandMark;