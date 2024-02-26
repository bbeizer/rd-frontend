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
            if (rowIndex === 0 && [2, 3, 4, 5].includes(cellIndex)) {
              pieceColor = 'black';
            } else if (rowIndex === 7 && [2, 3, 4, 5].includes(cellIndex)) { 
              pieceColor = 'white';
            }
            console.log(cellIndex)
            return <GridCell key={cellIndex} row={rowIndex} col={cellIndex} pieceColor={pieceColor} />;
          })}
        </GridRow>
      ))}
    </GridContainer>
  );
};

export default GameBoard;