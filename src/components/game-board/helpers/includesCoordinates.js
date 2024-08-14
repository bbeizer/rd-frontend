export const includesCoordinates = (movesArray, targetCoords) => 
    movesArray.some(move => move.row === targetCoords.row && move.col === targetCoords.col);
