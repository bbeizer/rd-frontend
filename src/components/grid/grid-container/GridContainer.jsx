// GridContainer.jsx
import React from 'react';
import './grid-container.css'; // Assuming you have some CSS for styling

const GridContainer = ({ children }) => {
  return <div className="grid-container">{children}</div>;
};

export default GridContainer;