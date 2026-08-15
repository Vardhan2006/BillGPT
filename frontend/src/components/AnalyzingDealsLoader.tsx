import React, { useEffect, useState } from 'react';
import { SphereAvatar } from './SphereAvatar';

interface AnalyzingDealsLoaderProps {
  searchQuery: string;
}

export const AnalyzingDealsLoader: React.FC<AnalyzingDealsLoaderProps> = ({ searchQuery }) => {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 700);
    const timer2 = setTimeout(() => setStep(3), 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="analyzing-loader-container">
      {/* User query speech bubble */}
      <div className="user-query-bubble-row">
        <div className="user-query-bubble">
          <span>{searchQuery || 'What is the best deal?'}</span>
        </div>
      </div>

      {/* Analyzing step card */}
      <div className="analyzing-card-row">
        <SphereAvatar size={42} className="mini-sphere" />

        <div className="analyzing-card">
          <div className={`analysis-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-icon checked">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="step-text">Analyzing deals</span>
          </div>

          <div className={`analysis-step ${step >= 2 ? 'active' : 'pending'}`}>
            <span className="step-icon">
              {step >= 2 ? (
                <div className="step-spinner" />
              ) : (
                <div className="step-dot" />
              )}
            </span>
            <span className="step-text">Finding the best ones</span>
          </div>

          <div className={`analysis-step ${step >= 3 ? 'active' : 'pending'}`}>
            <span className="step-icon">
              {step >= 3 ? (
                <div className="step-spinner" />
              ) : (
                <div className="step-dot" />
              )}
            </span>
            <span className="step-text">Comparing and saving you the most money</span>
          </div>
        </div>
      </div>
    </div>
  );
};
