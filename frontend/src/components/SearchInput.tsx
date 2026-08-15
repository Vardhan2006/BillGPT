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
    <div className="search-floating-bar">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input-field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          autoFocus={false}
        />

        <div className="search-actions">
          <button
            type="button"
            className="mic-icon-btn"
            aria-label="Voice Search"
            title="Voice Search"
            onClick={() => {
              setQuery('MacBook Air M3');
              onSearch('MacBook Air M3');
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>

          <button
            type="submit"
            className="send-icon-btn"
            disabled={!query.trim() || isLoading}
            aria-label="Search"
          >
            {isLoading ? (
              <div className="mini-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
