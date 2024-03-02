import React from 'react';
import './grid-cell.css';

const GridCell = ({ children, row, col, pieceColor}) => {
  const isLightCell = (row + col) % 2 === 0;
  return (
    <div className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}>
      {children}
    </div>
  );
};

export default GridCell;
