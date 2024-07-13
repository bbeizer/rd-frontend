import React from 'react';
import './playerInfo.css';

const PlayerInfo = ({ playerName, isUserTurn }) => {
    return (
      <div className="player-info">
        <div className="player-name">{playerName}</div>
        <div className={`player-status ${isUserTurn ? 'player-turn' : ''}`}>
          {isUserTurn ? "Your turn" : "Waiting..."}
        </div>
      </div>
    );
  };  

export default PlayerInfo;

