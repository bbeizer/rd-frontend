import React from 'react';
import './grid-cell.css';
import Piece from '../../piece/Piece';


const GridCell = ({ row, col, pieceColor, hasBall }) => {
  console.log(`Row: ${row}, Col: ${col}, Has Ball: ${hasBall}`);
  const isLightCell = (row + col) % 2 === 0;
  return (
    <div className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}>
      {pieceColor && <Piece color={pieceColor} hasBall={hasBall}/>}
    </div>
  );
};

export default GridCell;
