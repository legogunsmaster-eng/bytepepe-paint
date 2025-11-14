import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { PixelCanvas } from './components/PixelCanvas';
import { AIResultModal } from './components/AIResultModal';
import { generateNewArt } from './services/geminiService';
import { Tool, GridSize, Layer } from './types';
import { DEFAULT_COLOR, ERASER_COLOR, DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT } from './constants';
import { base64ToDataUrl } from './utils/imageUtils';

const createNewLayer = (name: string, width: number, height: number): Layer => ({
  id: `layer_${Date.now()}_${Math.random()}`,
  name,
  grid: Array(height).fill(null).map(() => Array(width).fill(ERASER_COLOR)),
  isVisible: true,
});

export default function App() {
  const [gridSize, setGridSize] = useState<GridSize>({ width: DEFAULT_GRID_WIDTH, height: DEFAULT_GRID_HEIGHT });
  
  const [layers, setLayers] = useState<Layer[]>(() => {
    return [createNewLayer('Layer 1', DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT)];
  });
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0].id);

  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGridSizeChange = (newSize: GridSize) => {
    setGridSize(newSize);
    setLayers(currentLayers => {
      return currentLayers.map(layer => {
        const newGrid = Array(newSize.height).fill(null).map(() => Array(newSize.width).fill(ERASER_COLOR));
        const oldHeight = layer.grid.length;
        const oldWidth = layer.grid[0]?.length || 0;
        const heightToCopy = Math.min(oldHeight, newSize.height);
        const widthToCopy = Math.min(oldWidth, newSize.width);

        for (let y = 0; y < heightToCopy; y++) {
          for (let x = 0; x < widthToCopy; x++) {
            newGrid[y][x] = layer.grid[y][x];
          }
        }
        return { ...layer, grid: newGrid };
      });
    });
  };

  const handleNewCanvas = useCallback(() => {
    const newLayer = createNewLayer('Layer 1', gridSize.width, gridSize.height);
    setLayers([newLayer]);
    setActiveLayerId(newLayer.id);
  }, [gridSize]);
  
  const handleUpdateActiveLayerGrid = useCallback((updater: (prevGrid: (string | null)[][]) => (string | null)[][]) => {
    setLayers(currentLayers => 
        currentLayers.map(layer => {
            if (layer.id === activeLayerId) {
                const newGrid = updater(layer.grid);
                return { ...layer, grid: newGrid };
            }
            return layer;
        })
    );
  }, [activeLayerId]);

  const addLayer = () => {
    const newLayer = createNewLayer(`Layer ${layers.length + 1}`, gridSize.width, gridSize.height);
    setLayers(currentLayers => [...currentLayers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return; // Cannot remove the last layer
    const layerIndex = layers.findIndex(l => l.id === id);
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (activeLayerId === id) {
      // If active layer was deleted, select the one before it, or the first one
      const newActiveIndex = Math.max(0, layerIndex - 1);
      setActiveLayerId(newLayers[newActiveIndex].id);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(currentLayers => 
      currentLayers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l)
    );
  };
  
  const reorderLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (direction === 'up' && index >= layers.length - 1) return;
    if (direction === 'down' && index <= 0) return;

    const newLayers = [...layers];
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]]; // Swap
    setLayers(newLayers);
  };
  
  const handleCopyAi = async () => {
    setError(null);
    setIsGenerating(true);
    setAiImage(null);

    try {
      // Create a composite image from visible layers on a white background
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = gridSize.width;
      compositeCanvas.height = gridSize.height;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not create canvas context for AI image generation.");
      }
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

      ctx.imageSmoothingEnabled = false;
      layers.forEach(layer => {
        if (layer.isVisible) {
          for (let y = 0; y < gridSize.height; y++) {
            for (let x = 0; x < gridSize.width; x++) {
              const color = layer.grid[y][x];
              if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        }
      });
      
      const dataUrl = compositeCanvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      
      const resultBase64 = await generateNewArt(base64Data);
      setAiImage(base64ToDataUrl(resultBase64));

    } catch (e) {
      console.error(e);
      setError('Failed to generate AI art. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header onCopyAi={handleCopyAi} isGenerating={isGenerating} />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <Toolbar
          gridSize={gridSize}
          setGridSize={handleGridSizeChange}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          showGridLines={showGridLines}
          setShowGridLines={setShowGridLines}
          onClear={handleNewCanvas}
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onToggleLayerVisibility={toggleLayerVisibility}
          onReorderLayer={reorderLayer}
        />
        <main className="flex-1 flex items-center justify-center p-4 bg-slate-200 overflow-auto">
          <PixelCanvas
            ref={canvasRef}
            layers={layers}
            activeLayerId={activeLayerId}
            onGridChange={handleUpdateActiveLayerGrid}
            gridSize={gridSize}
            selectedColor={selectedColor}
            activeTool={activeTool}
            showGridLines={showGridLines}
          />
        </main>
      </div>
      {(isGenerating || aiImage || error) && (
        <AIResultModal
          isLoading={isGenerating}
          image={aiImage}
          error={error}
          onClose={() => {
            setAiImage(null);
            setError(null);
          }}
        />
      )}
    </div>
  );
}
