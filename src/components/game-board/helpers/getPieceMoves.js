import { getKeyCoordinates } from '../../../utils/gameUtilities'
export const getPieceMoves = (initialRow, initialCol, board, hasMoved, originalSquare) => {
    if(!hasMoved){
        const legalMoves = [];
        const moveOffsets = [
            { row: -2, col: 1 }, { row: -1, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 1 },
            { row: 2, col: -1 }, { row: 1, col: -2 }, { row: -1, col: -2 }, { row: -2, col: -1 }
        ];

        moveOffsets.forEach(offset => {
            const newRow = initialRow + offset.row;
            const newCol = initialCol + offset.col;

            // Ensure the move is within the board limits
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetCellKey = generateCellKey(newRow, newCol);
                const targetCellContent = board[targetCellKey];

                // Check if the target cell is empty or contains an opponent's piece
                // Assuming board.turnPlayer stores the color of the current player
                if (!targetCellContent) {
                    legalMoves.push({ row: newRow, col: newCol });
                }
            }
        });

        return legalMoves;
    } else {
        return [getKeyCoordinates(originalSquare)]
    }   
};

export const generateCellKey = (row, col) => {
    return `${String.fromCharCode(97 + col)}${row + 1}`;
};

