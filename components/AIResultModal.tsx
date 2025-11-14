
import React from 'react';

interface AIResultModalProps {
  isLoading: boolean;
  image: string | null;
  error: string | null;
  onClose: () => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({ isLoading, image, error, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white text-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg mx-4 relative transform transition-all duration-300 scale-95 hover:scale-100" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-slate-800 transition-colors text-3xl font-bold leading-none">&times;</button>
        <div className="flex flex-col items-center justify-center text-center">
          {isLoading && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <h2 className="text-xl font-semibold text-slate-800">Generating Art...</h2>
              <p className="text-slate-500 mt-2">The AI is working its magic. This might take a moment.</p>
            </>
          )}
          {error && (
            <>
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-600">An Error Occurred</h2>
              <p className="text-slate-500 mt-2">{error}</p>
            </>
          )}
          {image && (
             <>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">AI Generated Art</h2>
              <img src={image} alt="AI generated pixel art" className="rounded-md border-2 border-slate-200 max-w-full max-h-[60vh]" style={{ imageRendering: 'pixelated' }}/>
              <p className="text-slate-500 text-sm mt-4">Here is the new creation from the AI. You can close this window to continue editing.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};