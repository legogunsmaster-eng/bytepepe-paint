import React from 'react';
import { Tool, GridSize, Layer } from '../types';
import { PALETTE_COLORS, MAX_GRID_SIZE, MIN_GRID_SIZE } from '../constants';
import { PencilIcon, EraserIcon, FillIcon, GridIcon, NewFileIcon, VisibleIcon, HiddenIcon, AddLayerIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface ToolbarProps {
  gridSize: GridSize;
  setGridSize: (size: GridSize) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;
  onClear: () => void;
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
}

const ToolButton: React.FC<{
  label: string;
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, icon, isActive, onClick, disabled = false }) => (
  <button
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={`p-3 rounded-md transition-colors duration-200 ${
      isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
    } disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed`}
  >
    {icon}
  </button>
);

export const Toolbar: React.FC<ToolbarProps> = ({
  gridSize,
  setGridSize,
  selectedColor,
  setSelectedColor,
  activeTool,
  setActiveTool,
  showGridLines,
  setShowGridLines,
  onClear,
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleLayerVisibility,
  onReorderLayer,
}) => {
  return (
    <aside className="w-full md:w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 p-4 flex flex-col gap-6 overflow-y-auto">
      {/* Tools */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Tools</h3>
        <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
          <ToolButton label="Pencil" icon={<PencilIcon className="w-5 h-5" />} isActive={activeTool === 'pencil'} onClick={() => setActiveTool('pencil')} />
          <ToolButton label="Eraser" icon={<EraserIcon className="w-5 h-5" />} isActive={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} />
          <ToolButton label="Fill" icon={<FillIcon className="w-5 h-5" />} isActive={activeTool === 'fill'} onClick={() => setActiveTool('fill')} />
          <ToolButton label="Toggle Grid" icon={<GridIcon className="w-5 h-5" />} isActive={showGridLines} onClick={() => setShowGridLines(!showGridLines)} />
          <ToolButton label="New Canvas" icon={<NewFileIcon className="w-5 h-5" />} isActive={false} onClick={onClear} />
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Color</h3>
        <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-md border-2 border-slate-300" style={{ backgroundColor: selectedColor }}></div>
            <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="w-full h-10 p-1 bg-slate-200 rounded-md cursor-pointer border border-slate-300" />
        </div>
        <div className="grid grid-cols-10 md:grid-cols-6 gap-1.5">
          {PALETTE_COLORS.map(color => (
            <button
              key={color}
              title={color}
              onClick={() => setSelectedColor(color)}
              className={`w-full aspect-square rounded-full transition-transform duration-150 transform hover:scale-110 ${
                selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Layers */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Layers</h3>
        <div className="bg-slate-200 rounded-md p-2 space-y-2 max-h-60 overflow-y-auto">
          {[...layers].reverse().map((layer, i) => {
            const index = layers.length - 1 - i;
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors duration-150 ${
                  activeLayerId === layer.id ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-white hover:bg-slate-100'
                }`}
              >
                <button title={layer.isVisible ? 'Hide Layer' : 'Show Layer'} onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(layer.id); }}>
                  {layer.isVisible ? <VisibleIcon className="w-5 h-5 text-slate-600" /> : <HiddenIcon className="w-5 h-5 text-slate-400" />}
                </button>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{layer.name}</span>
                 <button title="Delete Layer" disabled={layers.length <= 1} onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }} className="disabled:text-slate-300 text-slate-500 hover:text-red-500">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <ToolButton label="Add Layer" icon={<AddLayerIcon className="w-5 h-5" />} isActive={false} onClick={onAddLayer} />
          <ToolButton label="Delete Layer" icon={<TrashIcon className="w-5 h-5" />} isActive={false} onClick={() => onRemoveLayer(activeLayerId)} disabled={layers.length <= 1} />
          <ToolButton label="Move Layer Down" icon={<ArrowDownIcon className="w-5 h-5" />} isActive={false} onClick={() => onReorderLayer(activeLayerId, 'down')} disabled={layers.findIndex(l => l.id === activeLayerId) === 0} />
          <ToolButton label="Move Layer Up" icon={<ArrowUpIcon className="w-5 h-5" />} isActive={false} onClick={() => onReorderLayer(activeLayerId, 'up')} disabled={layers.findIndex(l => l.id === activeLayerId) === layers.length - 1} />
        </div>
      </div>

      {/* Grid Size */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Grid Size</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm">
            W:
            <input
              type="range"
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              value={gridSize.width}
              onChange={(e) => setGridSize({ ...gridSize, width: parseInt(e.target.value) })}
              className="w-full"
            />
            <span className="text-slate-600 w-6 text-right">{gridSize.width}</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            H:
            <input
              type="range"
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              value={gridSize.height}
              onChange={(e) => setGridSize({ ...gridSize, height: parseInt(e.target.value) })}
              className="w-full"
            />
            <span className="text-slate-600 w-6 text-right">{gridSize.height}</span>
          </label>
        </div>
      </div>
    </aside>
  );
};
