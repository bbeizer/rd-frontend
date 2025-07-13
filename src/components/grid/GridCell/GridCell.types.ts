import type { ReactNode, MouseEvent, HTMLAttributes } from 'react';

export type HighlightColor = 'red' | 'yellow' | 'blue' | null;

export type GridCellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  row: number;
  col: number;
  id: string;
  highlight?: HighlightColor;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
};
