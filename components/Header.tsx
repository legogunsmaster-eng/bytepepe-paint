
import React from 'react';
import { CopyAiIcon } from './icons';

interface HeaderProps {
  onCopyAi: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onCopyAi, isGenerating }) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 flex justify-between items-center z-10">
      <h1 className="text-xl font-bold text-slate-800">AI Pixel Art Editor</h1>
      <button
        onClick={onCopyAi}
        disabled={isGenerating}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
      >
        <CopyAiIcon className="w-5 h-5" />
        {isGenerating ? 'Generating...' : 'Create with AI'}
      </button>
    </header>
  );
};