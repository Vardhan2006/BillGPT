import React, { useState } from 'react';
import { Header } from './components/Header';
import { TopTicker } from './components/TopTicker';
import { SphereAvatar } from './components/SphereAvatar';
import { QuickPrompts } from './components/QuickPrompts';
import { SearchInput } from './components/SearchInput';
import { AnalyzingDealsLoader } from './components/AnalyzingDealsLoader';
import { ProductResultCard } from './components/ProductResultCard';
import { AuthModal } from './components/AuthModal';
import { CardsModal } from './components/CardsModal';
import { SaveComparisonModal } from './components/SaveComparisonModal';
import { SavedComparisonsView } from './components/SavedComparisonsView';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import type { SearchComparisonResult } from './types/api';

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const [currentView, setCurrentView] = useState<'home' | 'results' | 'saved'>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<SearchComparisonResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCardsOpen, setIsCardsOpen] = useState<boolean>(false);
  const [saveModalResult, setSaveModalResult] = useState<SearchComparisonResult | null>(null);
  const [savedProductIds, setSavedProductIds] = useState<Set<number>>(new Set());

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setIsSearching(true);
    setSearchError(null);
    setCurrentView('results');

    const startTime = Date.now();
    try {
      const data = await api.deals.search(query);

      // Ensure analyzing animation is seen smoothly for at least 1.6s
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 1600 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setResults(data);
    } catch (err: any) {
      setSearchError(err.message || 'Failed to fetch deals. Please check your backend connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenSaveModal = (result: SearchComparisonResult) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setSaveModalResult(result);
  };

  const handleSavedSuccess = () => {
    if (saveModalResult) {
      setSavedProductIds((prev) => new Set(prev).add(saveModalResult.product.id));
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSearchQuery('');
    setResults([]);
    setSearchError(null);
  };

  // Get user greeting name
  const greetingName = user?.email ? user.email.split('@')[0] : 'there';
  const capitalizedGreeting = greetingName.charAt(0).toUpperCase() + greetingName.slice(1);

  return (
    <div className="app-layout">
      <Header
        showBack={currentView !== 'home'}
        onBack={handleBackToHome}
        onOpenCards={() => setIsCardsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSaved={() => setCurrentView('saved')}
        currentView={currentView}
      />

      <main className="main-content-container">
        {/* Top Ticker Deals */}
        {currentView === 'home' && (
          <TopTicker onSelectItem={(q) => handleSearch(q)} />
        )}

        {/* Home Screen View */}
        {currentView === 'home' && (
          <div className="home-screen-content">
            <div className="hero-center-box">
              <SphereAvatar size={84} />

              <div className="greeting-text">
                Hey {capitalizedGreeting},
              </div>
              <h1 className="hero-heading">
                What do you want to save on today?
              </h1>
            </div>

            <QuickPrompts onSelectPrompt={(q) => handleSearch(q)} />
          </div>
        )}

        {/* Results Screen View */}
        {currentView === 'results' && (
          <div className="results-screen-content">
            {isSearching ? (
              <AnalyzingDealsLoader searchQuery={searchQuery} />
            ) : searchError ? (
              <div className="error-banner-card">
                <span className="error-icon">⚠️</span>
                <h3 className="error-title">Unable to Find Deals</h3>
                <p className="error-text">{searchError}</p>
                <button
                  type="button"
                  className="pill-btn retry-btn"
                  onClick={() => handleSearch(searchQuery)}
                >
                  Retry Search
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-results-card">
                <span className="empty-icon">🔍</span>
                <h3 className="empty-title">No matching products found</h3>
                <p className="empty-text">
                  We couldn't find deals matching "{searchQuery}". Try searching for MacBook, Sony Headphones, Samsung TV, or Dyson.
                </p>
                <button
                  type="button"
                  className="pill-btn primary-pill-btn"
                  onClick={() => handleSearch('MacBook')}
                >
                  View Featured MacBook Deals
                </button>
              </div>
            ) : (
              <div className="results-list-container">
                <div className="results-meta-header">
                  <span className="results-count-text">
                    Found <strong>{results.length}</strong> product comparison{results.length > 1 ? 's' : ''} for "{searchQuery}"
                  </span>
                </div>

                {results.map((item) => (
                  <ProductResultCard
                    key={item.product.id}
                    result={item}
                    onSaveComparison={handleOpenSaveModal}
                    isSaved={savedProductIds.has(item.product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Comparisons Screen View */}
        {currentView === 'saved' && (
          <SavedComparisonsView onBackToSearch={handleBackToHome} />
        )}
      </main>

      {/* Floating Bottom Search Input */}
      <SearchInput
        onSearch={handleSearch}
        isLoading={isSearching}
        placeholder={
          currentView === 'home'
            ? 'Ask a question or search (e.g. MacBook, Sony XM5, Dyson)...'
            : 'Ask a followup question or search another product...'
        }
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <CardsModal
        isOpen={isCardsOpen}
        onClose={() => setIsCardsOpen(false)}
      />

      <SaveComparisonModal
        isOpen={!!saveModalResult}
        onClose={() => setSaveModalResult(null)}
        result={saveModalResult}
        onSavedSuccess={handleSavedSuccess}
      />
    </div>
  );
};
