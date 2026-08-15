import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  onOpenCards: () => void;
  onOpenAuth: () => void;
  onOpenSaved: () => void;
  currentView: 'home' | 'results' | 'saved';
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  showBack = false,
  onOpenCards,
  onOpenAuth,
  onOpenSaved,
  currentView,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        {showBack ? (
          <button
            type="button"
            className="icon-circle-btn back-btn"
            onClick={onBack}
            aria-label="Go Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        ) : null}

        <div className="brand-logo" onClick={onBack} role="button" tabIndex={0}>
          <span className="brand-bill">Bill</span>
          <span className="brand-gpt-badge">GPT</span>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="pill-btn card-pill-btn"
          onClick={onOpenCards}
        >
          Your cards
        </button>

        {isAuthenticated && (
          <button
            type="button"
            className={`pill-btn saved-pill-btn ${currentView === 'saved' ? 'active' : ''}`}
            onClick={onOpenSaved}
          >
            Saved
          </button>
        )}

        <div className="user-menu-wrapper">
          {isAuthenticated ? (
            <button
              type="button"
              className="icon-circle-btn menu-btn"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="User Menu"
              title={user?.email}
            >
              <span className="user-initial">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="pill-btn auth-pill-btn"
              onClick={onOpenAuth}
            >
              Sign In
            </button>
          )}

          {showMenu && isAuthenticated && (
            <div className="dropdown-menu">
              <div className="dropdown-user-info">
                <span className="user-label">Signed in as</span>
                <strong className="user-email-text">{user?.email}</strong>
              </div>
              <hr className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  onOpenSaved();
                }}
              >
                Saved Comparisons
              </button>
              <button
                type="button"
                className="dropdown-item logout-item"
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
