import React from 'react';
import './grid-row.css';

const GridRow = ({ children }: { children: React.ReactNode }) => {
  return <div className="grid-row">{children}</div>;
};

export default GridRow;
