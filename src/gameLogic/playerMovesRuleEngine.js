// Assuming the boardStatus is an object with keys like "a1", "b2", etc., and values are objects with piece details.
import { getKeyCoordinates } from "../utils/gameUtilities";

export const getPieceMoves = (initialRow, initialCol, board, hasMoved, originalSquare) => {
    console.log("this is the og square:" + originalSquare)
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

export const legalMove = (board, landing, moves) => {
    // Convert each move from row-col to your cell key format
    const moveKeys = moves.map(move => generateCellKey(move.row, move.col));

    // Check if the landing spot is one of the moves
    if (moveKeys.includes(landing)) {
        // Optionally, also check if the landing spot is not occupied by a piece of the same color
        // Assuming board[landing] contains a piece with a 'color' property
        // and you have access to the current player's color (currentPlayerColor)
        if (!board[landing] || board[landing].color !== currentPlayerColor) {
            return true; // The move is legal
        }
    }

    return false; // The move is not legal
};


export const generateCellKey = (row, col) => {
    return `${String.fromCharCode(97 + col)}${row + 1}`;
};

export const applyMove = (startPosition, endPosition, boardStatus, playerColor) => {
    // Logic to move a piece and update the boardStatus
    // This is just a stub and needs to be implemented based on how boardStatus is structured.
};

export const applyPass = (startPosition, endPosition, boardStatus) => {
    // Logic to pass the ball from one piece to another
    // Update boardStatus accordingly.
};

export const isValidPass = (startPosition, endPosition, boardStatus) => {
    // Determine if a pass is valid based on the positions and boardStatus
    return true; // Simplified; replace with actual logic.
};

export const switchTurn = (currentTurn) => {
    return currentTurn === 'white' ? 'black' : 'white';
};

export const checkWinner = (boardStatus) => {
    // Logic to check if a player has won
    // Return the color of the winner, if any.
};
