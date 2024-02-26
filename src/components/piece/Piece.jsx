import React from 'react';
import './piece.css'; // Ensure the CSS file is correctly imported

const Piece = ({ color, hasBall }) => {
  console.log(`Has Ball: ${hasBall}`);
  return (
    <div className={`piece ${color}-piece`}>
      <div className="hole"></div> {/* Always render the hole */}
      {hasBall && <div className="ball"></div>} {/* Conditionally render the ball */}
    </div>
  );
};

export default Piece;