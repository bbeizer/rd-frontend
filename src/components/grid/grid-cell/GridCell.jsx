import React from 'react';
import './grid-cell.css';

const GridCell = ({ style, children, row, col, redHighlight, yellowHighlight, onClick }) => {
  const isLightCell = (row + col) % 2 === 0;
  const baseStyle = { ...style };
  if (redHighlight) {
    baseStyle.backgroundColor = 'red';
  }
  if (yellowHighlight) {
    baseStyle.backgroundColor = 'yellow';
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
