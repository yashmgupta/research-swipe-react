import { useState, useCallback, memo } from 'react';
import './SearchBar.css';

const SearchBar = memo(function SearchBar({ onSearch, initialValue }) {
  const [topic, setTopic] = useState(initialValue || '');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (topic.trim()) {
      onSearch(topic. trim());
    }
  }, [topic, onSearch]);

  const handleChange = useCallback((e) => {
    setTopic(e. target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (topic.trim()) {
        onSearch(topic.trim());
      }
    }
  }, [topic, onSearch]);

  return (
    <div className="search-box">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={topic}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter topic (e.g., machine learning, DNA sequencing)"
          className="search-input"
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="search-btn" disabled={!topic.trim()}>
          Find Papers
        </button>
      </form>
    </div>
  );
});

export default SearchBar;
