'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Button } from './Button';

interface SuccessMessageProps {
  businessName?: string;
  onGoToDashboard: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  businessName = 'Your Business',
  onGoToDashboard,
}) => {
  const [showSparkles, setShowSparkles] = useState(true);

  useEffect(() => {
    // Hide sparkles after 3 seconds
    const sparkleTimer = setTimeout(() => {
      setShowSparkles(false);
    }, 3000);

    return () => {
      clearTimeout(sparkleTimer);
    };
  }, []);

  // Inline CSS for the sparkle effect
  const sparkleStyle = {
    position: 'absolute' as const,
    top: `${-10 - Math.random() * 20}%`, // Start above screen
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 4}s`,
    animationDuration: `${3 + Math.random() * 2}s`,
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, #ffedd5 0%, #fb923c 50%, transparent 70%)',
    opacity: 0.8,
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Sparkle Effect Container */}
      {showSparkles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Custom animation keyframes for sparkle effect */}
          <style>
            {`
              @keyframes sparkle-move {
                0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
              }
              @keyframes bounce-in {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
              }
              .sparkle-item {
                animation: sparkle-move 4s ease-out infinite;
              }
              .animate-bounce-in {
                animation: bounce-in 0.6s ease-out;
              }
            `}
          </style>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute sparkle-item"
              style={{
                ...sparkleStyle,
                top: `${-10 - Math.random() * 20}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Success Content */}
      <div className="text-center z-10 max-w-2xl mx-auto px-6">
        {/* Success Icon with Animation */}
        <div className="relative mb-10">
          {/* Background Pulsing Ring */}
          <div className="absolute inset-0 w-36 h-36 bg-orange-400 rounded-full mx-auto animate-ping opacity-20 transition-opacity duration-1000"></div>
          {/* Main Icon Circle */}
          <div className="relative w-36 h-36 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(251,146,60,0.8)] animate-bounce-in">
            <CheckCircleIcon className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tighter">
          <span className="text-orange-400">AWESOME JOB!</span>
        </h1>

        <h2 className="text-3xl sm:text-4xl font-bold text-gray-300 mb-8">
          You finished the setup for{' '}
          <span className="text-orange-400">{businessName}</span>.
        </h2>

        {/* Summary Card */}
        <div className="bg-neutral-800 border-2 border-orange-400/50 rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl shadow-neutral-900/50">
          <p className="text-xl text-gray-300 mb-0 leading-relaxed font-medium">
            You finished adding the most important information for your
            business! You are closer to having your own professional website for
            clients.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          <p className="text-lg text-gray-400 mb-6 font-light">
            Head to the <strong>Dashboard</strong> now to finish your setup!
          </p>

          <Button
            onClick={onGoToDashboard}
            variant="primary"
            size="lg"
            className="w-full sm:w-2/3 mx-auto shadow-orange-500/50"
          >
            Go to Dashboard →
          </Button>
        </div>
      </div>
    </div>
  );
};

// Keep the old export for backward compatibility during transition
export const CompletionCelebration = SuccessMessage;
