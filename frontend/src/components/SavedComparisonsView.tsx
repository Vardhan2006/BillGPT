import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { SavedComparison } from '../types/api';

interface SavedComparisonsViewProps {
  onBackToSearch: () => void;
}

export const SavedComparisonsView: React.FC<SavedComparisonsViewProps> = ({
  onBackToSearch,
}) => {
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchComparisons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.comparisons.list();
      setComparisons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved comparisons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this saved comparison?')) {
      return;
    }

    setDeletingId(id);
    try {
      await api.comparisons.delete(id);
      setComparisons((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Error deleting comparison: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="saved-view-state">
        <div className="loading-spinner" />
        <p className="state-text">Loading your saved comparisons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saved-view-state error-state">
        <span className="state-icon">⚠️</span>
        <p className="state-text">{error}</p>
        <button type="button" className="pill-btn retry-btn" onClick={fetchComparisons}>
          Try Again
        </button>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="saved-view-state empty-state">
        <span className="state-icon">📂</span>
        <h3 className="empty-title">No Saved Comparisons Yet</h3>
        <p className="empty-desc">
          When you search for deals and save comparison calculations, they will appear here.
        </p>
        <button
          type="button"
          className="pill-btn primary-pill-btn"
          onClick={onBackToSearch}
        >
          Search Deals Now
        </button>
      </div>
    );
  }

  return (
    <div className="saved-comparisons-view">
      <div className="saved-header-row">
        <h1 className="saved-title">Your Saved Comparisons</h1>
        <span className="saved-count-chip">{comparisons.length} saved</span>
      </div>

      <div className="saved-cards-grid">
        {comparisons.map((comp) => {
          const data = comp.comparison_data || {};
          const cheapest = data.cheapest_deal || {};
          const card = data.applied_card;

          return (
            <div key={comp.id} className="saved-comparison-card">
              <div className="saved-card-top">
                <div>
                  <h3 className="saved-item-title">{comp.title}</h3>
                  <span className="saved-date">{formatDate(comp.created_at)}</span>
                </div>

                <button
                  type="button"
                  className="delete-comp-btn"
                  onClick={() => handleDelete(comp.id)}
                  disabled={deletingId === comp.id}
                  title="Delete comparison"
                  aria-label="Delete comparison"
                >
                  {deletingId === comp.id ? (
                    <div className="mini-spinner" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>

              {comp.notes && (
                <div className="saved-notes-box">
                  <span className="notes-icon">📝</span>
                  <p className="notes-text">{comp.notes}</p>
                </div>
              )}

              <div className="saved-stats-box">
                <div className="saved-stat-row">
                  <span className="stat-name">Product:</span>
                  <span className="stat-value">{data.product_name || 'Item'}</span>
                </div>

                <div className="saved-stat-row">
                  <span className="stat-name">Cheapest Deal:</span>
                  <span className="stat-value">
                    {cheapest.source ? `${cheapest.source} ($${cheapest.price})` : 'N/A'}
                  </span>
                </div>

                {card && (
                  <div className="saved-stat-row">
                    <span className="stat-name">Card Applied:</span>
                    <span className="stat-value">
                      {card.name} ({(card.reward_rate * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}

                <div className="saved-stat-row total-row">
                  <span className="stat-name">Effective Price:</span>
                  <strong className="stat-value final-price">
                    ${comp.best_deal_price.toFixed(2)}
                  </strong>
                </div>

                <div className="saved-stat-row savings-row">
                  <span className="stat-name">Total Savings:</span>
                  <span className="stat-value savings-text">
                    ${comp.total_savings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
