import React from 'react';

function Card({ className = '', children }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export default Card;
