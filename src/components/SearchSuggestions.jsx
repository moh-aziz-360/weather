import React from 'react';

const SearchSuggestions = ({ suggestions, onSelect, show }) => {
  if (!show || !suggestions.length) return null;

  return (
    <div className="search-suggestions">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="suggestion-item"
          onClick={() => onSelect(suggestion)}
        >
          <span className="suggestion-icon">📍</span>
          <span className="suggestion-text">{suggestion}</span>
        </button>
      ))}
    </div>
  );
};

export default SearchSuggestions;