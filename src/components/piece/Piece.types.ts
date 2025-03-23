import type { MouseEvent } from 'react';

export type PieceProps = {
  color: string;
  hasBall: boolean;
  position: string;
  onClick?: (e: MouseEvent) => void;
};
