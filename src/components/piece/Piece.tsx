import type { PieceProps } from './Piece.types';
import './piece.css';

const Piece: React.FC<PieceProps> = ({ color, hasBall, position }) => {
  return (
    <div className={`piece ${color}-piece`} data-position={position}>
      <div className="hole"></div>
      {hasBall && <div className="ball"></div>}
    </div>
  );
};

export default Piece;
