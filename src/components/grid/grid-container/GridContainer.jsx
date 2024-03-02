import React from 'react';
import './grid-container.css'; 

const GridContainer = ({ children }) => {
  return <div className="grid-container">{children}</div>;
};

export default GridContainer;