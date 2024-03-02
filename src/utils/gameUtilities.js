
export const initialSetup = (rowIndex, cellIndex) => {
    let pieceColor = null;
    let hasBall = false;

    if (rowIndex === 0 && [2, 3, 4, 5].includes(cellIndex)) {
        pieceColor = 'black';
        hasBall = cellIndex === 4;
    } else if (rowIndex === 7 && [2, 3, 4, 5].includes(cellIndex)) {
        pieceColor = 'white';
        hasBall = cellIndex === 3; 
    }

    return { pieceColor, hasBall };
};

export const getKeyCoordinates = (cellKey) => {
    const col = cellKey.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = parseInt(cellKey.slice(1), 10) - 1;
    return { row, col };
};
