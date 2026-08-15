import React from 'react';
import type { SearchComparisonResult } from '../types/api';
import { BestWayToPayCard } from './BestWayToPayCard';

interface ProductResultCardProps {
  result: SearchComparisonResult;
  onSaveComparison: (result: SearchComparisonResult) => void;
  isSaved?: boolean;
}

export const ProductResultCard: React.FC<ProductResultCardProps> = ({
  result,
  onSaveComparison,
  isSaved = false,
}) => {
  const { product, deals, best_way_to_pay } = result;

  // Find lowest price among deals to mark CHEAPEST badge
  const minPrice = deals.length > 0 ? Math.min(...deals.map((d) => d.price)) : product.base_price;

  return (
    <article className="product-result-card">
      <div className="product-card-header">
        <div className="product-info-col">
          <div className="product-badge-row">
            {product.category && (
              <span className="product-category-chip">{product.category}</span>
            )}
            <span className="product-deals-count-chip">{deals.length} deals compared</span>
          </div>

          <h2 className="product-title">{product.name}</h2>
          
          {product.description && (
            <p className="product-desc">{product.description}</p>
          )}
        </div>

        <div className="product-msrp-col">
          <span className="msrp-label">Retail MSRP</span>
          <span className="msrp-price">${product.base_price.toFixed(2)}</span>
        </div>
      </div>

      {/* Competing Deals Section */}
      <div className="deals-section">
        <div className="section-subtitle-row">
          <h3 className="section-subtitle">Competing Merchant Sources</h3>
          <span className="deals-hint">Ranked lowest to highest</span>
        </div>

        <div className="deals-list">
          {deals.map((deal) => {
            const isCheapest = deal.price === minPrice;

            return (
              <div
                key={deal.id}
                className={`deal-row-card ${isCheapest ? 'cheapest-row' : ''}`}
              >
                <div className="deal-left-info">
                  <div className="deal-source-header">
                    <span className="deal-source-name">{deal.source}</span>
                    <span className={`deal-type-chip ${deal.source_type}`}>
                      {deal.source_type}
                    </span>

                    {isCheapest && (
                      <span className="cheapest-badge" title="Cheapest available merchant offer">
                        ★ CHEAPEST
                      </span>
                    )}
                  </div>

                  {deal.discount_details && (
                    <div className="deal-discount-details">
                      {deal.discount_details}
                    </div>
                  )}
                </div>

                <div className="deal-right-pricing">
                  <div className="deal-price">${deal.price.toFixed(2)}</div>
                  {deal.savings_vs_base > 0 && (
                    <div className="deal-savings">
                      Save ${deal.savings_vs_base.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best Way to Pay Highlight */}
      <BestWayToPayCard
        bestWay={best_way_to_pay}
        onSave={() => onSaveComparison(result)}
        isSaved={isSaved}
      />
    </article>
  );
};
