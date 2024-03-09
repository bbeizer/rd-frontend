import React from 'react';
import './grid-cell.css';

const GridCell = ({ style, children, row, col, highlight }) => {
  console.log(highlight)
  const isLightCell = (row + col) % 2 === 0;
  const baseStyle = { ...style }; // Copy the existing style props
  // Conditionally add highlighting styles
  if (highlight) {
    baseStyle.backgroundColor = 'red'; // This will override the class-based background color
  }
  // Apply the correct class and merge in any passed styles, including dynamic highlighting
  return (
    <div
      style={baseStyle}
      className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}
    >
      {children}
    </div>
  );
};


export default GridCell;
