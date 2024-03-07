import React, { useEffect, useState } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer'
import {getKeyCoordinates} from '../../utils/gameUtilities'

const GameBoard = ({ gameModel, pendingMove }) => {
  const [activePiece, setActivePiece] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState(null)

  const pieceClickHandler = (piece) => {
    // find the possible moves:
    // const possibleMoves = getPieceMoves(piece)
    setActivePiece(piece)
    console.log('set active piece')
  }

  const renderBoard = () => {
    return Object.entries(gameModel.currentBoardStatus).map(([cellKey, cellData]) => {
      const { row, col } = getKeyCoordinates(cellKey);
      const piece = cellData ? (
        <Piece color={cellData.piece} hasBall={cellData.hasBall} onclick={pieceClickHandler}/>
      ) : null;
      
      /* if activePiece is not null, then for that piece, whatever its possible moves are, highlight those cells */
      /* if pendingMove, maybe display that differently as well, also can disable or enable other pieces based on that */
      // once the piece is moved, maybe it highlights the initial starting position because that's where it can move back to
      // what data do I need to enable the functionality that I want.

      /*
        if activePiece is not null, then for that piece, whatever its possible moves are, highlight those cells

        1. add click handler to piece
        2. get possible moves for piece, set to state
        3. read from possible moves state, if a grid cell is in there, style it differently
      */

        // if in possible moves, set some CSS
      return (
        <GridCell key={cellKey} row={row} col={col} >
          {piece}
        </GridCell>
      );
    });
  };

  return <GridContainer>{renderBoard()}</GridContainer>;
};

export default GameBoard;
