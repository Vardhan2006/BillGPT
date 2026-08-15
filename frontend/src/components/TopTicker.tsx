import React from 'react';

interface TickerItem {
  id: string;
  sourceIcon: string;
  title: string;
  discount: string;
  originalPrice?: string;
  finalPrice: string;
  query: string;
}

interface TopTickerProps {
  onSelectItem: (query: string) => void;
}

const TICKER_DEALS: TickerItem[] = [
  {
    id: '1',
    sourceIcon: '💻',
    title: 'MacBook Air M3',
    discount: '15% off',
    originalPrice: '$1,299',
    finalPrice: '$1,055',
    query: 'MacBook Air',
  },
  {
    id: '2',
    sourceIcon: '🎧',
    title: 'Sony XM5 Headphones',
    discount: '21% off',
    originalPrice: '$399',
    finalPrice: '$314',
    query: 'Sony WH-1000XM5',
  },
  {
    id: '3',
    sourceIcon: '📺',
    title: 'Samsung 65" OLED TV',
    discount: '$300 off',
    originalPrice: '$1,899',
    finalPrice: '$1,535',
    query: 'Samsung OLED',
  },
  {
    id: '4',
    sourceIcon: '📱',
    title: 'iPhone 15 Pro Max',
    discount: '17% off',
    originalPrice: '$1,199',
    finalPrice: '$959',
    query: 'iPhone 15 Pro',
  },
  {
    id: '5',
    sourceIcon: '🧹',
    title: 'Dyson V15 Vacuum',
    discount: '23% off',
    originalPrice: '$749',
    finalPrice: '$575',
    query: 'Dyson V15',
  },
];

export const TopTicker: React.FC<TopTickerProps> = ({ onSelectItem }) => {
  return (
    <div className="top-ticker-container">
      <div className="top-ticker-track">
        {TICKER_DEALS.map((deal) => (
          <div
            key={deal.id}
            className="ticker-card"
            onClick={() => onSelectItem(deal.query)}
            role="button"
            tabIndex={0}
          >
            <div className="ticker-card-header">
              <span className="ticker-icon">{deal.sourceIcon}</span>
              <span className="ticker-title">
                {deal.title}: <strong>{deal.discount}</strong>
              </span>
            </div>
            <div className="ticker-card-price">
              {deal.originalPrice && (
                <span className="original-price">{deal.originalPrice} → </span>
              )}
              <span className="final-price">{deal.finalPrice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
