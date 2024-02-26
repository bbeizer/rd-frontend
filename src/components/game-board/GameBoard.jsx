// GameBoard.jsx
import React from 'react';
import GridContainer from '../grid/grid-container/GridContainer'; 
import GridRow from '../grid/grid-row/GridRow';
import GridCell from '../grid/grid-cell/GridCell';

const GameBoard = () => {
  return (
    <GridContainer>
      {[...Array(8)].map((_, rowIndex) => (
        <GridRow key={rowIndex}>
          {[...Array(8)].map((_, cellIndex) => {
            let pieceColor = null;
            let hasBall = false;

            if (rowIndex === 0 && [2, 3, 4, 5].includes(cellIndex)) {
              pieceColor = 'black';
              hasBall = cellIndex === 4;
            } else if (rowIndex === 7 && [2, 3, 4, 5].includes(cellIndex)) { 
              pieceColor = 'white';
              hasBall = cellIndex === 3;
            }

            return <GridCell key={cellIndex} row={rowIndex} col={cellIndex} pieceColor={pieceColor} hasBall={hasBall} />;
          })}
        </GridRow>
      ))}
    </GridContainer>
  );
};

export default GameBoard;
