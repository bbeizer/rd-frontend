import type { ReactNode, MouseEvent } from 'react';

export type HighlightColor = 'red' | 'yellow' | 'blue' | null;

export type GridCellProps = {
  children: ReactNode;
  row: number;
  col: number;
  id: string;
  highlight?: HighlightColor;
  onClick: (event: MouseEvent) => void;
};
