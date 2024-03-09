import React from 'react';
import './piece.css'

const Piece = ({ color, hasBall, position, onClick, }) => {

const handleClick = () => onClick({ color, hasBall, position});

  return (
    <div onClick={handleClick} className={`piece ${color}-piece`}>
      <div className="hole"></div>
      {hasBall && <div className="ball"></div>} 
    </div>
  );
};

export default Piece;