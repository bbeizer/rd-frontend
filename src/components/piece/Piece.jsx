import React from 'react';
import './piece.css'

const Piece = ({ color, hasBall}) => {

  return (
    <div className={`piece ${color}-piece`} >
      <div className="hole"></div>
      {hasBall && <div className="ball"></div>} 
    </div>
  );
};

export default Piece;