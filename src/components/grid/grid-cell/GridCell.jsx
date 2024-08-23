import './grid-cell.css';

const GridCell = ({ style, children, row, col, id, redHighlight, yellowHighlight, blueHighlight, onClick }) => {
  const isLightCell = (row + col) % 2 === 0;
  const baseStyle = { ...style };
  if (redHighlight) {
    baseStyle.backgroundColor = 'red';
  }
  if (yellowHighlight) {
    baseStyle.backgroundColor = 'yellow';
  }
  if (blueHighlight){
    baseStyle.backgroundColor = 'blue';
  }
  return (
    <div
      style={baseStyle}
      className={`grid-cell ${isLightCell ? 'light-cell' : 'dark-cell'}`}
      onClick={onClick}
      id = {id}
    >
      {children}
    </div>
  );
};


export default GridCell;