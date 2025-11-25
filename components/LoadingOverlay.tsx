import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
       <div className="relative w-24 h-24 mb-6">
         <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
         <div className="absolute inset-2 border-r-2 border-cyan-700 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
         <div className="absolute inset-4 border-b-2 border-white/20 rounded-full animate-pulse"></div>
       </div>
       <h3 className="text-xl font-medium text-white mb-2 tracking-wide animate-pulse">GENERATING VIEW</h3>
       <p className="text-cyan-500/80 font-mono text-sm">Analysing geometry... Exploding components...</p>
    </div>
  );
};