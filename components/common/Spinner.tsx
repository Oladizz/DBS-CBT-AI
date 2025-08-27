
import React from 'react';

const Spinner = ({ size = 'w-8 h-8' }: { size?: string }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600 ${size}`} />
  );
};

export default Spinner;
