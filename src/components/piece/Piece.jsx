import React from 'react';
import './piece.css'

const Piece = ({ color, hasBall, onClick, position}) => {

  return (
    <div onClick={onClick} className={`piece ${color}-piece`} data-position={position}>
      <div className="hole"></div>
      {hasBall && <div className="ball"></div>} 
    </div>
  );
};

export default Piece;