import React from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer'
import {getKeyCoordinates} from '../../utils/gameUtilities'

const GameBoard = ({ gameModel }) => {
  const renderBoard = () => {
    return Object.entries(gameModel.currentBoardStatus).map(([cellKey, cellData]) => {
      const { row, col } = getKeyCoordinates(cellKey);
      const piece = cellData ? (
        <Piece color={cellData.piece} hasBall={cellData.hasBall} />
      ) : null;

      return (
        <GridCell key={cellKey} row={row} col={col}>
          {piece}
        </GridCell>
      );
    });
  };

  return <GridContainer>{renderBoard()}</GridContainer>;
};

export default GameBoard;
