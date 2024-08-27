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
  let id = null;

  if (rowIndex === 0 && [2, 3, 4, 5].includes(colIndex)) {
      pieceColor = 'black';
      hasBall = colIndex === 4;
      id = uuidv4(); 
  } else if (rowIndex === 7 && [2, 3, 4, 5].includes(colIndex)) {
      pieceColor = 'white';
      hasBall = colIndex === 3;
      id = uuidv4();
  }

  return { pieceColor, hasBall, id };
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
