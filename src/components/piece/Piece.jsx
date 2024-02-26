
import React from 'react';
import './piece.css';

const Piece = ({ color }) => {
  const holeColor = color === 'black' ? 'white' : 'black';

  return (
    <div className="piece-border">
      <div className={`piece ${color}-piece`}>
        <div className={`hole ${holeColor}-hole`}></div>
      </div>
    </div>
  );
};

export default Piece;
