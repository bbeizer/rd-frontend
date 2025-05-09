import './grid-cell.css';
import type { GridCellProps } from './GridCell.types';

const GridCell: React.FC<GridCellProps> = ({
  children,
  row,
  col,
  id,
  highlight = null,
  onClick,
}) => {
  const isLightCell = (row + col) % 2 !== 0;

  const backgroundColor =
    highlight === 'red'
      ? 'red'
      : highlight === 'yellow'
        ? 'yellow'
        : highlight === 'blue'
          ? 'blue'
          : undefined;

  const baseStyle = { backgroundColor };

  return (
    <div
      style={baseStyle}
      className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}
      onClick={onClick}
      id={id}
    >
      {children}
    </div>
  );
};

export default GridCell;
