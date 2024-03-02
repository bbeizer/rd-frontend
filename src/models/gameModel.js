import {initialSetup} from '../utils/gameUtilities'; 

export const initializeGameModel = () => {
    const initialBoardStatus = {};
    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
        for (let colIndex = 0; colIndex < 8; colIndex++) {
            const cellKey = `${String.fromCharCode(97 + colIndex)}${rowIndex + 1}`;
            const { pieceColor, hasBall } = initialSetup(rowIndex, colIndex);
            if (pieceColor) {
                initialBoardStatus[cellKey] = { piece: pieceColor, hasBall };
            } else {
                initialBoardStatus[cellKey] = null;
            }
        }
    }

    return {
        id: '',
        status: 'not started',
        turnPlayer: 'white',
        moveHistory: [],
        currentBoardStatus: initialBoardStatus,
    };
};
