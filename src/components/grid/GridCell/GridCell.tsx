import './grid-cell.css';
import type { GridCellProps } from './GridCell.types';

const GridCell: React.FC<GridCellProps> = ({
  children,
  row,
  col,
  id,
  highlight = null,
  onClick,
  ...restProps
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.currentTarget.click();
    }
  };

  return (
    <div
      {...restProps}
      style={baseStyle}
      className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      id={id}
    >
      {children}
    </div>
  );
};

export default GridCell;
