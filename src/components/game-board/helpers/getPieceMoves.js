import { getKeyCoordinates } from "../../../utils/gameUtilities";

export const getPieceMoves = (cellKey, board, hasMoved, originalSquare) => {
    const { row: initialRow, col: initialCol } = getKeyCoordinates(cellKey);
    const legalMoves = [];

    if (!hasMoved) {
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
                if (!targetCellContent || targetCellContent.color !== board[cellKey].color) {
                    legalMoves.push(targetCellKey);  // Push the cell key directly
                }
            }
        });

        return legalMoves;
    } else {
        return [originalSquare];  // If the piece has moved, return to its original square using the cell key
    }
};

export const generateCellKey = (row, col) => {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
};
