
// Game
{
  id: UUID,
  status: 'playing' | 'not started' | 'completed',
  players: [
    { "id": "UUID", "color": "black" },
    { "id": "UUID", "color": "white" }
  ]
  turnNumber: 10,
  turnPlayer: 'black',
  moveHistory: [
    { turnNumber: 9, black: nD7 - e6, white: nE5 - c3 },
    { turnNumber: 8, black: nD7 - e6, white: nE5 - c3 },
    ...
  ],
  currentBoardStatus: {
    a1: null,
    a2: { 'black', 'hasBall'}
    ...
  }
}


// User
{
  id: UUID,
  username: 'benB123'
  email: 'bhb987@gmail.com'
  password: 'password'
}

// Piece
{
    id: UUID,
    position: A3,
    color: 'black' | 'white',
    hasball: true | false,
}

// Move
{
    id: UUID,
    gameID: UUID,
    playerID: UUID,
    initialPiece: 'A2'
    finalPiece: 'B4'
    intialBall: 'E1'
    finalBall: 'H2,
}

// Ball
{
    id: UUID,
    position: A3,
    playersBall: 'black' | 'white',
}

