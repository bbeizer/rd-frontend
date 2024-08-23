import { v4 as uuidv4 } from 'uuid';

export const generateUserID = () => {
  let userID = localStorage.getItem('userId');
  if (!userID) {
    userID = uuidv4();
    localStorage.setItem('userID', userID);
  }
  return userID;
};

const initialSetup = (rowIndex, colIndex) => {
  let pieceColor = null;
  let hasBall = false;

  // Adjusting logic to place pieces correctly based on row and column indexes
  if (rowIndex === 7 && [2, 3, 4, 5].includes(colIndex)) { // Rank 1, White pieces
    pieceColor = 'white';
    hasBall = colIndex === 3; // Has ball at d1 (colIndex 3)
  } else if (rowIndex === 6 && [2, 3, 4, 5].includes(colIndex)) { // Rank 2, White pieces
    pieceColor = 'white';
  } else if (rowIndex === 1 && [2, 3, 4, 5].includes(colIndex)) { // Rank 7, Black pieces
    pieceColor = 'black';
    hasBall = colIndex === 4; // Has ball at e8 (colIndex 4)
  } else if (rowIndex === 0 && [2, 3, 4, 5].includes(colIndex)) { // Rank 8, Black pieces
    pieceColor = 'black';
  }

  return { pieceColor, hasBall };
};

export const initializeGameBoard = () => {
  const board = {};
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cellKey = `${String.fromCharCode(97 + col)}${8 - row}`; // Traditional chess notation
      const { pieceColor, hasBall } = initialSetup(row, col);
      if (pieceColor) {
        board[cellKey] = { color: pieceColor, hasBall, position: cellKey };
      } else {
        board[cellKey] = null;
      }
    }
  }
  return board;
};

export const getKeyCoordinates = (cellKey) => {
  const col = cellKey.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(cellKey.slice(1), 10);
  return { row, col };
};

export const toCellKey = (row, col) => {
  const letter = String.fromCharCode(97 + col);
  const number = 8 - row;
  return `${letter}${number}`;
};
