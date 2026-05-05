import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Check, Loader2 } from 'lucide-react';

const LoadingTerminal = ({ steps, currentStep, isComplete, title }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden font-mono"
      >
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 border-b border-slate-700">
          <Terminal size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">{title || "Terminal Execution"}</span>
        </div>
        
        <div className="p-6 space-y-4">
          {steps.map((step, idx) => {
            const isActive = currentStep === idx;
            const isDone = currentStep > idx || isComplete;
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isActive || isDone ? 1 : 0.3, x: 0 }}
                className={`flex flex-col gap-1 ${isActive ? 'text-primary' : isDone ? 'text-secondary' : 'text-slate-600'}`}
              >
                <div className="flex items-center gap-3 text-sm font-bold">
                  {isDone ? (
                    <span className="w-5 h-5 bg-secondary/20 text-secondary rounded flex items-center justify-center"><Check size={12} /></span>
                  ) : isActive ? (
                    <span className="w-5 h-5 bg-primary/20 text-primary rounded flex items-center justify-center"><Loader2 size={12} className="animate-spin" /></span>
                  ) : (
                    <span className="w-5 h-5 border border-slate-700 rounded flex items-center justify-center shadow-inner"></span>
                  )}
                  {step.name}
                </div>
                {(isActive || isDone) && step.detail && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="ml-8 text-xs text-slate-400"
                  >
                    {isActive ? '> ' + step.activeText : '> ' + step.detail}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {isComplete && (
          <div className="bg-secondary/10 border-t border-secondary/20 p-4 shrink-0 text-center text-sm font-bold text-secondary">
            [ Execution Successful. Returning to main thread. ]
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingTerminal;
