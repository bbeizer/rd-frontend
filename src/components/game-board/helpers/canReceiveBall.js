export const canReceiveBall = (piece, possiblePasses) => {
    return possiblePasses.includes(piece.position);
};

