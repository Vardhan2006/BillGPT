import React, { useState } from 'react';
import { api } from '../services/api';
import type { SavedComparisonCreate, SearchComparisonResult } from '../types/api';

interface SaveComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SearchComparisonResult | null;
  onSavedSuccess: () => void;
}

export const SaveComparisonModal: React.FC<SaveComparisonModalProps> = ({
  isOpen,
  onClose,
  result,
  onSavedSuccess,
}) => {
  if (!isOpen || !result) return null;

  const defaultTitle = `${result.product.name} Deal Comparison`;
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the comparison.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: SavedComparisonCreate = {
      product_id: result.product.id,
      title: title.trim(),
      notes: notes.trim() || undefined,
      comparison_data: {
        product_name: result.product.name,
        base_price: result.product.base_price,
        cheapest_deal: result.best_way_to_pay.cheapest_deal,
        applied_card: result.best_way_to_pay.best_card,
        effective_price: result.best_way_to_pay.effective_price,
        total_savings: result.best_way_to_pay.total_savings,
        savings_percentage: result.best_way_to_pay.savings_percentage,
        payment_recommendation: result.best_way_to_pay.payment_recommendation,
        timestamp: new Date().toISOString(),
      },
      best_deal_price: result.best_way_to_pay.effective_price,
      total_savings: result.best_way_to_pay.total_savings,
    };

    try {
      await api.comparisons.create(payload);
      onSavedSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save comparison snapshot.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container save-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Save Deal Comparison</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="save-form">
          <div className="summary-preview-box">
            <div className="preview-row">
              <span className="preview-label">Product:</span>
              <strong className="preview-val">{result.product.name}</strong>
            </div>
            <div className="preview-row">
              <span className="preview-label">Effective Price:</span>
              <strong className="preview-val price-highlight">
                ${result.best_way_to_pay.effective_price.toFixed(2)}
              </strong>
            </div>
            <div className="preview-row">
              <span className="preview-label">Net Savings:</span>
              <strong className="preview-val savings-highlight">
                Save ${result.best_way_to_pay.total_savings.toFixed(2)} ({result.best_way_to_pay.savings_percentage}%)
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comp-title">Comparison Title</label>
            <input
              id="comp-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MacBook Air Best Buy vs B&H"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="comp-notes">Notes (optional)</label>
            <textarea
              id="comp-notes"
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes or reminders about this deal..."
              rows={3}
            />
          </div>

          <div className="modal-action-row">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Comparison Snapshot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
