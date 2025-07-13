import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getPieceMoves } from '../helpers/getPieceMoves';
import { movePiece } from '../helpers/movePiece';
import { passBall } from '../helpers/passBall';
import { getValidPasses } from '../helpers/getValidPasses';
import { Piece } from '../../../types/Piece';

describe('Game Logic Tests', () => {
    let mockBoard: Record<string, Piece | null>;

    beforeEach(() => {
        // Initialize a mock board
        mockBoard = {};
        const files = 'abcdefgh';
        for (const file of files) {
            for (let rank = 1; rank <= 8; rank++) {
                const key = `${file}${rank}`;
                mockBoard[key] = null;
            }
        }

        // Add some test pieces
        mockBoard['e1'] = { color: 'white', hasBall: false, position: 'e1' };
        mockBoard['d1'] = { color: 'white', hasBall: true, position: 'd1' };
        mockBoard['c8'] = { color: 'black', hasBall: false, position: 'c8' };
        mockBoard['e8'] = { color: 'black', hasBall: true, position: 'e8' };
    });

    describe('getPieceMoves', () => {
        it('should return valid knight moves for a piece that has not moved', () => {
            const moves = getPieceMoves('e1', mockBoard, false, '');

            // Knight moves from e1
            const expectedMoves = ['f3', 'g2', 'c2', 'd3'];
            expectedMoves.forEach(move => {
                expect(moves).toContain(move);
            });
        });

        it('should return only original square when piece has moved', () => {
            const moves = getPieceMoves('f3', mockBoard, true, 'e1');
            expect(moves).toEqual(['e1']);
        });

        it('should not return moves to occupied squares', () => {
            // Place a piece at f3
            mockBoard['f3'] = { color: 'black', hasBall: false, position: 'f3' };

            const moves = getPieceMoves('e1', mockBoard, false, '');
            expect(moves).not.toContain('f3');
        });

        it('should not return moves outside the board', () => {
            // Test from corner position
            const moves = getPieceMoves('a1', mockBoard, false, '');

            // Should not contain moves outside the board
            expect(moves).not.toContain('b-1');
            expect(moves).not.toContain('c0');
        });
    });

    describe('movePiece', () => {
        it('should move a piece from source to target', () => {
            const newBoard = movePiece('e1', 'f3', mockBoard);

            expect(newBoard['e1']).toBeNull();
            expect(newBoard['f3']).toEqual({
                color: 'white',
                hasBall: false,
                position: 'f3'
            });
        });

        it('should update the piece position', () => {
            const newBoard = movePiece('e1', 'f3', mockBoard);

            expect(newBoard['f3']?.position).toBe('f3');
        });

        it('should handle moving a piece with a ball', () => {
            const newBoard = movePiece('d1', 'e3', mockBoard);

            expect(newBoard['d1']).toBeNull();
            expect(newBoard['e3']?.hasBall).toBe(true);
        });
    });

    describe('passBall', () => {
        it('should pass ball from source to target', () => {
            const newBoard = passBall('d1', 'e1', mockBoard);

            expect(newBoard['d1']?.hasBall).toBe(false);
            expect(newBoard['e1']?.hasBall).toBe(true);
        });

        it('should maintain piece colors after pass', () => {
            const newBoard = passBall('d1', 'e1', mockBoard);

            expect(newBoard['d1']?.color).toBe('white');
            expect(newBoard['e1']?.color).toBe('white');
        });
    });

    describe('getValidPasses', () => {
        it('should return valid pass targets for a piece with ball', () => {
            const passes = getValidPasses('d1', 'white', mockBoard);

            // Should be able to pass to adjacent white pieces
            expect(passes).toContain('e1');
            // Note: c1 is not a valid pass because there's no piece there in our test setup
        });

        it('should not return passes to enemy pieces', () => {
            // Add a black piece adjacent to d1
            mockBoard['c1'] = { color: 'black', hasBall: false, position: 'c1' };

            const passes = getValidPasses('d1', 'white', mockBoard);
            expect(passes).not.toContain('c1');
        });

        it('should not return passes to empty squares', () => {
            const passes = getValidPasses('d1', 'white', mockBoard);

            // Should not include empty squares
            expect(passes).not.toContain('d2');
            expect(passes).not.toContain('f1');
        });
    });

    describe('Board State Validation', () => {
        it('should maintain board integrity after operations', () => {
            // Move a piece
            let newBoard = movePiece('e1', 'f3', mockBoard);

            // Pass the ball
            newBoard = passBall('d1', 'e1', newBoard);

            // Verify board still has correct structure
            const files = 'abcdefgh';
            for (const file of files) {
                for (let rank = 1; rank <= 8; rank++) {
                    const key = `${file}${rank}`;
                    expect(newBoard).toHaveProperty(key);
                }
            }
        });

        it('should handle edge cases gracefully', () => {
            // Test with empty board
            const emptyBoard: Record<string, Piece | null> = {};
            const files = 'abcdefgh';
            for (const file of files) {
                for (let rank = 1; rank <= 8; rank++) {
                    const key = `${file}${rank}`;
                    emptyBoard[key] = null;
                }
            }

            // Should not crash with empty board
            const moves = getPieceMoves('e1', emptyBoard, false, '');
            expect(Array.isArray(moves)).toBe(true);
        });
    });
}); 