import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  onComplete?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
      const step = steps[currentStep];
      if (step.targetId === 'center') {
        setTargetRect(null);
        return;
      }

      const element = document.getElementById(step.targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null); 
      }
    }
  }, [isOpen, currentStep, steps]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      if (onComplete) onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  
  if (targetRect) {
    const gap = 20;
    // Default to right
    let top = targetRect.top + (targetRect.height / 2) - 100; // approximate center
    let left = targetRect.right + gap;

    if (step.position === 'bottom') {
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width / 2) - 150;
    } else if (step.position === 'top') {
        top = targetRect.top - gap - 200; // approximate height
        left = targetRect.left + (targetRect.width / 2) - 150;
    } else if (step.position === 'left') {
        left = targetRect.left - gap - 320; // width of card
    }

    // Boundary checks (simple)
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    tooltipStyle = {
        top: `${top}px`,
        left: `${left}px`,
        position: 'fixed',
        zIndex: 10001 // Above overlay
    };
  } else {
    // Center
    tooltipStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        zIndex: 10001
    };
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Highlight Target (if exists) */}
        {targetRect && (
            <div 
                className="absolute border-4 border-rose-500 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.8)] pointer-events-none transition-all duration-500 ease-in-out"
                style={{
                    top: targetRect.top - 5,
                    left: targetRect.left - 5,
                    width: targetRect.width + 10,
                    height: targetRect.height + 10,
                }}
            ></div>
        )}

        {/* Tooltip Card */}
        <div 
            className="bg-white w-[320px] md:w-[400px] p-8 rounded-[2rem] shadow-3xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300"
            style={tooltipStyle}
        >
            <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                    Adım {currentStep + 1} / {steps.length}
                </span>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 italic mb-4">{step.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8 text-sm">{step.content}</p>

            <div className="flex justify-between items-center">
                <button 
                    onClick={handlePrev} 
                    disabled={currentStep === 0}
                    className={`p-3 rounded-full transition-all ${currentStep === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex gap-1">
                    {steps.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-rose-500 w-6' : 'bg-slate-200'}`}></div>
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:scale-105 transition-all shadow-lg"
                >
                    {isLastStep ? (
                        <>Bitir <Check size={16} /></>
                    ) : (
                        <>İleri <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};
