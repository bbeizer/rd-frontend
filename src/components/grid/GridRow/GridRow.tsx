// GridRow.jsx
import React from 'react';
import './grid-row.css'; // Assuming you have some CSS for styling

const GridRow = ({ children }: { children: React.ReactNode }) => {
  return <div className="grid-row">{children}</div>;
};

export default GridRow;
