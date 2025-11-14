export type Tool = 'pencil' | 'eraser' | 'fill';

export interface GridSize {
  width: number;
  height: number;
}

export interface Layer {
  id: string;
  name: string;
  grid: (string | null)[][];
  isVisible: boolean;
}
