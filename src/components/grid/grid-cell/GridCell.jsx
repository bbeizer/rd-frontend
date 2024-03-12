import React from 'react';
import './grid-cell.css';

const GridCell = ({ style, children, row, col, highlight, onClick }) => {
  const isLightCell = (row + col) % 2 === 0;
  const baseStyle = { ...style };
  if (highlight) {
    baseStyle.backgroundColor = 'red';
  }
  return (
    <div
      style={baseStyle}
      className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};


export default GridCell;
