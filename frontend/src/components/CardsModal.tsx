import React from 'react';

interface CardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CardInfo {
  name: string;
  rate: string;
  rateDecimal: number;
  type: string;
  desc: string;
  badgeColor: string;
}

const SEEDED_CARDS: CardInfo[] = [
  {
    name: 'American Express Gold Card',
    rate: '4.0%',
    rateDecimal: 0.04,
    type: 'Points (4x)',
    desc: '4x Membership Rewards points on eligible dining and supermarket purchases.',
    badgeColor: '#eab308',
  },
  {
    name: 'Capital One SavorOne',
    rate: '3.0%',
    rateDecimal: 0.03,
    type: 'Cashback (3%)',
    desc: '3% cashback on dining, entertainment, and popular streaming services.',
    badgeColor: '#f97316',
  },
  {
    name: 'Bank of America Customized Cash',
    rate: '3.0%',
    rateDecimal: 0.03,
    type: 'Cashback (3%)',
    desc: '3% cashback in your choice category including online shopping.',
    badgeColor: '#ef4444',
  },
  {
    name: 'Citi Double Cash',
    rate: '2.0%',
    rateDecimal: 0.02,
    type: 'Cashback (2%)',
    desc: '2% total cash back: 1% when you buy plus 1% as you pay.',
    badgeColor: '#3b82f6',
  },
  {
    name: 'Chase Sapphire Preferred',
    rate: '2.0%',
    rateDecimal: 0.02,
    type: 'Points (2x)',
    desc: '2x Ultimate Rewards points on travel and dining.',
    badgeColor: '#6366f1',
  },
  {
    name: 'Chase Freedom Unlimited',
    rate: '1.5%',
    rateDecimal: 0.015,
    type: 'Cashback (1.5%)',
    desc: '1.5% unlimited cash back on all general purchases.',
    badgeColor: '#10b981',
  },
];

export const CardsModal: React.FC<CardsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container cards-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Your Rewards Cards</h2>
            <p className="modal-subtitle">
              BillGPT automatically checks these card reward rates to find your lowest effective price.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="cards-catalog-list">
          {SEEDED_CARDS.map((card) => (
            <div key={card.name} className="card-item-row">
              <div className="card-item-left">
                <div className="card-item-title-row">
                  <span className="card-item-name">{card.name}</span>
                  <span
                    className="card-rate-pill"
                    style={{ backgroundColor: `${card.badgeColor}18`, color: card.badgeColor }}
                  >
                    {card.rate}
                  </span>
                </div>
                <p className="card-item-desc">{card.desc}</p>
              </div>

              <div className="card-item-right">
                <span className="card-item-type">{card.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
