import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Tool, GridSize, Layer } from '../types';
import { ERASER_COLOR } from '../constants';

interface PixelCanvasProps {
  layers: Layer[];
  activeLayerId: string;
  onGridChange: (updater: (prevGrid: (string | null)[][]) => (string | null)[][]) => void;
  gridSize: GridSize;
  selectedColor: string;
  activeTool: Tool;
  showGridLines: boolean;
}

export const PixelCanvas = forwardRef<HTMLCanvasElement, PixelCanvasProps>(({
  layers,
  activeLayerId,
  onGridChange,
  gridSize,
  selectedColor,
  activeTool,
  showGridLines,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPixel = useRef<{ x: number, y: number } | null>(null);

  useImperativeHandle(ref, () => canvasRef.current!, []);

  const getPixelSize = () => {
    if (!canvasRef.current) return 20;
    const { width, height } = gridSize;
    const parent = canvasRef.current.parentElement;
    if (!parent) return 20;
    const availableWidth = parent.clientWidth * 0.9;
    const availableHeight = parent.clientHeight * 0.9;
    return Math.max(1, Math.floor(Math.min(availableWidth / width, availableHeight / height)));
  };
  
  const [pixelSize, setPixelSize] = useState(getPixelSize());
  
  useEffect(() => {
    const handleResize = () => setPixelSize(getPixelSize());
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gridSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard background for transparency
    const TILE_SIZE = 8;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#eee';
    for (let i = 0; i < canvas.width / TILE_SIZE; i++) {
        for (let j = 0; j < canvas.height / TILE_SIZE; j++) {
            if ((i + j) % 2 === 0) {
                ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Render all visible layers from bottom to top
    layers.forEach(layer => {
      if (layer.isVisible) {
        for (let y = 0; y < gridSize.height; y++) {
          for (let x = 0; x < gridSize.width; x++) {
            const color = layer.grid[y]?.[x];
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
          }
        }
      }
    });

    if (showGridLines && pixelSize > 4) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= gridSize.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, gridSize.height * pixelSize);
        ctx.stroke();
      }
      for (let y = 0; y <= gridSize.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(gridSize.width * pixelSize, y * pixelSize);
        ctx.stroke();
      }
    }
  }, [layers, gridSize, pixelSize, showGridLines]);

  const drawPixel = (x: number, y: number, color: string | null) => {
    onGridChange(prevGrid => {
      if (y < 0 || y >= prevGrid.length || x < 0 || x >= prevGrid[0].length) {
          return prevGrid;
      }
      if (prevGrid[y][x] === color) return prevGrid;

      const newGrid = prevGrid.map(row => [...row]);
      newGrid[y][x] = color;
      return newGrid;
    });
  };
  
  const drawLine = (x0: number, y0: number, x1: number, y1: number, color: string | null) => {
    onGridChange(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      let changes = false;

      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        if (y0 >= 0 && y0 < newGrid.length && x0 >= 0 && x0 < newGrid[0].length) {
          if (newGrid[y0][x0] !== color) {
            newGrid[y0][x0] = color;
            changes = true;
          }
        }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
      return changes ? newGrid : prevGrid;
    });
  };

  const floodFill = (x: number, y: number, newColor: string | null) => {
    onGridChange(currentGrid => {
      const targetColor = currentGrid[y]?.[x];
      if (targetColor === newColor) return currentGrid;

      const newGrid = currentGrid.map(row => [...row]);
      const stack: [number, number][] = [[x, y]];
      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        if (cx < 0 || cx >= gridSize.width || cy < 0 || cy >= gridSize.height) continue;
        if (newGrid[cy][cx] === targetColor) {
          newGrid[cy][cx] = newColor;
          stack.push([cx + 1, cy]);
          stack.push([cx - 1, cy]);
          stack.push([cx, cy + 1]);
          stack.push([cx, cy - 1]);
        }
      }
      return newGrid;
    });
  };
  
  const handleMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    
    if (x < 0 || x >= gridSize.width || y < 0 || y >= gridSize.height) {
        lastPixel.current = null;
        return;
    }
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = handleMouseEvent(e);
    if (!coords) return;
    
    setIsDrawing(true);
    const color = activeTool === 'eraser' ? ERASER_COLOR : selectedColor;

    if (activeTool === 'fill') {
      floodFill(coords.x, coords.y, color);
    } else {
      drawPixel(coords.x, coords.y, color);
      lastPixel.current = coords;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = handleMouseEvent(e);
    if (!coords) return;

    const color = activeTool === 'eraser' ? ERASER_COLOR : selectedColor;
    
    if (lastPixel.current) {
        drawLine(lastPixel.current.x, lastPixel.current.y, coords.x, coords.y, color);
    } else {
        drawPixel(coords.x, coords.y, color);
    }
    lastPixel.current = coords;
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPixel.current = null;
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    lastPixel.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={gridSize.width * pixelSize}
      height={gridSize.height * pixelSize}
      className="bg-white shadow-lg rounded-md border-2 border-slate-300 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ imageRendering: 'pixelated' }}
    />
  );
});
