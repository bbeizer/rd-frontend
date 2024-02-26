import React from 'react';
import './grid-cell.css';
import Piece from '../../piece/Piece';


const GridCell = ({ row, col, pieceColor }) => {
  console.log(`GridCell [${row},${col}] pieceColor:`, pieceColor);
  const isLightCell = (row + col) % 2 === 0;
  return (
    <div className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}>
      {pieceColor && <Piece color={pieceColor} />}
    </div>
  );
};

export default GridCell;
