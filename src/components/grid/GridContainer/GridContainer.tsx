import React from 'react';
import './grid-container.css';

const GridContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="grid-container">{children}</div>;
};

export default GridContainer;
