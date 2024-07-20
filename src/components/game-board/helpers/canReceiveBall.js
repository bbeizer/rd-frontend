import { getKeyCoordinates } from "../../../utils/gameUtilities";
import { getValidPasses } from "./getValidPasses";
export const canReceiveBall = (piece, activePiece, gameBoard) => {
    if (!activePiece.hasBall) return false;
    const { row: activeRow, col: activeCol } = getKeyCoordinates(activePiece.position);
    const validPasses = getValidPasses(activeRow, activeCol, activePiece.color, gameBoard);
    return validPasses.includes(piece.position);
};

