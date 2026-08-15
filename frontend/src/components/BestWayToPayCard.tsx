import React from 'react';
import type { BestWayToPay } from '../types/api';

interface BestWayToPayCardProps {
  bestWay: BestWayToPay;
  onSave: () => void;
  isSaved?: boolean;
}

export const BestWayToPayCard: React.FC<BestWayToPayCardProps> = ({
  bestWay,
  onSave,
  isSaved = false,
}) => {
  return (
    <div className="best-way-card">
      <div className="best-way-badge">
        <span className="best-way-sparkle">✨</span> Best Way to Pay
      </div>

      <div className="best-way-body">
        <div className="best-way-price-row">
          <div className="price-main">
            <span className="effective-label">Effective Net Price</span>
            <div className="effective-price-val">${bestWay.effective_price.toFixed(2)}</div>
          </div>

          <div className="savings-badge-pill">
            <span className="savings-val">Save ${bestWay.total_savings.toFixed(2)}</span>
            <span className="savings-pct">({bestWay.savings_percentage}%)</span>
          </div>
        </div>

        <div className="recommendation-text-box">
          <p className="recommendation-paragraph">
            {bestWay.payment_recommendation}
          </p>
        </div>

        <div className="best-way-breakdown-grid">
          <div className="breakdown-stat">
            <span className="stat-label">Cheapest Source</span>
            <strong className="stat-val">{bestWay.cheapest_deal.source} (${bestWay.cheapest_source_price.toFixed(2)})</strong>
          </div>

          <div className="breakdown-stat">
            <span className="stat-label">Applied Card</span>
            <strong className="stat-val">
              {bestWay.best_card
                ? `${bestWay.best_card.name} (${(bestWay.card_reward_rate * 100).toFixed(1)}%)`
                : 'Direct / Standard'}
            </strong>
          </div>

          {bestWay.card_reward_earned > 0 && (
            <div className="breakdown-stat">
              <span className="stat-label">Card Rewards Earned</span>
              <strong className="stat-val reward-val">+${bestWay.card_reward_earned.toFixed(2)}</strong>
            </div>
          )}

          <div className="breakdown-stat">
            <span className="stat-label">Retail MSRP</span>
            <strong className="stat-val base-val">${bestWay.base_price.toFixed(2)}</strong>
          </div>
        </div>

        <div className="best-way-actions">
          <button
            type="button"
            className={`save-comparison-btn ${isSaved ? 'saved' : ''}`}
            onClick={onSave}
          >
            {isSaved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Comparison Saved
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save This Comparison
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
