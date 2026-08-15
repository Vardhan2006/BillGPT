import React, { useState } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  isLoading = false,
  placeholder = 'Ask a question or search (e.g. MacBook, Sony XM5, Dyson)...',
  initialValue = '',
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  return (
    <div className="search-floating-bar" role="search">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-icon-left" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <input
          type="text"
          className="search-input-field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          autoFocus={false}
          aria-label="Search products and deals"
        />

        {query.trim() && !isLoading && (
          <button
            type="button"
            className="clear-icon-btn"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        <div className="search-actions">
          <button
            type="submit"
            className="send-icon-btn"
            disabled={!query.trim() || isLoading}
            aria-label="Submit search"
            title="Search"
          >
            {isLoading ? (
              <div className="mini-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
