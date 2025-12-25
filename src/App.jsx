import { useState, useCallback, useMemo, useReducer, memo, useEffect } from 'react';
import './App.css';
import SwipeCard from './components/SwipeCard';
import ExportModal from './components/ExportModal';
import ArchivePage from './components/ArchivePage';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import { Download, Archive } from 'lucide-react';
import { useOptimizedSearch } from './hooks/useOptimizedSearch';

// Reducer for batched state updates (single re-render instead of 4)
const paperReducer = (state, action) => {
  switch (action. type) {
    case 'LIKE':
      return {
        ...state,
        likedPapers: [... state.likedPapers, action.paper],
        archivedPapers: {
          ...state.archivedPapers,
          [action.folder]: [...(state.archivedPapers[action.folder] || []), action.paper]
        },
        currentIndex: state.currentIndex + 1
      };
    case 'DISLIKE':
      return {
        ...state,
        dislikedPapers: [...state.dislikedPapers, action.paper],
        currentIndex: state.currentIndex + 1
      };
    case 'RESET_INDEX':
      return { ...state, currentIndex: 0 };
    case 'SET_INDEX':
      return { ...state, currentIndex: action.index };
    case 'DELETE_FOLDER':  {
      const newArchived = { ...state.archivedPapers };
      delete newArchived[action.folder];
      return { ...state, archivedPapers: newArchived };
    }
    case 'ARCHIVE_TO_FOLDER': 
      return {
        ...state,
        archivedPapers: {
          ...state. archivedPapers,
          [action.folder]: [...(state.archivedPapers[action.folder] || []), action.paper]
        }
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const initialPaperState = {
  likedPapers: [],
  dislikedPapers: [],
  archivedPapers: {},
  currentIndex: 0
};

// Memoized Stats to prevent re-renders
const MemoizedStats = memo(Stats);

// Memoized SearchBar to prevent re-renders
const MemoizedSearchBar = memo(SearchBar);

function App() {
  const [paperState, dispatch] = useReducer(paperReducer, initialPaperState);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showArchivePage, setShowArchivePage] = useState(false);

  const {
    papers,
    isLoading,
    isFreshLoading,
    error,
    currentTopic,
    search,
    getCurrentPaper
  } = useOptimizedSearch('');

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('respart_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload:  parsed });
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const stateToSave = {
        likedPapers: paperState.likedPapers,
        dislikedPapers: paperState.dislikedPapers,
        archivedPapers: paperState.archivedPapers
      };
      localStorage.setItem('respart_state', JSON. stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [paperState. likedPapers, paperState.dislikedPapers, paperState.archivedPapers]);

  // Memoized current/next paper
  const currentPaper = useMemo(() =>
    getCurrentPaper(paperState.currentIndex),
    [getCurrentPaper, paperState.currentIndex]
  );

  const nextPaper = useMemo(() =>
    papers[paperState.currentIndex + 1],
    [papers, paperState.currentIndex]
  );

  // Memoized stats calculation
  const archivedCount = useMemo(() =>
    Object.values(paperState.archivedPapers).reduce((sum, arr) => sum + arr.length, 0),
    [paperState.archivedPapers]
  );

  // Single dispatch for like/dislike (batched update)
  const handleDecision = useCallback((decision) => {
    if (! currentPaper) return;

    if (decision === 'like') {
      dispatch({
        type: 'LIKE',
        paper: currentPaper,
        folder: currentTopic || 'General'
      });
    } else {
      dispatch({ type: 'DISLIKE', paper: currentPaper });
    }
  }, [currentPaper, currentTopic]);

  const handleSearch = useCallback((topic) => {
    dispatch({ type: 'RESET_INDEX' });
    search(topic);
  }, [search]);

  const deleteFolder = useCallback((folderName) => {
    dispatch({ type: 'DELETE_FOLDER', folder: folderName });
  }, []);

  const archiveCurrent = useCallback(() => {
    if (! currentPaper) return;

    const folderName = prompt(`Archive "${currentPaper.title}" to which folder?`, currentTopic || 'General');

    if (folderName) {
      dispatch({
        type: 'ARCHIVE_TO_FOLDER',
        paper: currentPaper,
        folder: folderName
      });
      alert(`✅ Paper archived to "${folderName}" folder! `);
    }
  }, [currentPaper, currentTopic]);

  const openExportModal = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setShowExportModal(false);
  }, []);

  const openArchivePage = useCallback(() => {
    setShowArchivePage(true);
  }, []);

  const closeArchivePage = useCallback(() => {
    setShowArchivePage(false);
  }, []);

  const restartSearch = useCallback(() => {
    dispatch({ type: 'RESET_INDEX' });
    if (currentTopic) {
      search(currentTopic);
    }
  }, [currentTopic, search]);

  return (
    <div className="app-container">
      <div className="header">
        <h1>ResPart</h1>
        <p>Find your research partner</p>
        {isFreshLoading && <span className="fresh-indicator">🔄 Refreshing...</span>}
      </div>

      <MemoizedSearchBar onSearch={handleSearch} initialValue={currentTopic} />

      <MemoizedStats
        liked={paperState.likedPapers.length}
        disliked={paperState.dislikedPapers.length}
        archived={archivedCount}
      />

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => handleSearch(currentTopic)}>Retry</button>
        </div>
      )}

      <div className="card-container">
        {isLoading ?  (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading papers...</p>
          </div>
        ) : currentPaper ? (
          <>
            {nextPaper && (
              <div className="next-card">
                <div className="card-preview">
                  <h3>{nextPaper.title}</h3>
                </div>
              </div>
            )}

            <SwipeCard
              key={currentPaper.id}
              paper={currentPaper}
              onDecision={handleDecision}
            />

            <div className="corner-actions">
              <button className="corner-btn" onClick={openExportModal}>
                <Download size={16} /> Export
              </button>
              <button className="corner-btn" onClick={openArchivePage}>
                <Archive size={16} /> Archive
              </button>
            </div>
          </>
        ) : papers.length === 0 && ! isLoading ? (
          <div className="no-papers">
            <h2>👋 Welcome to ResPart!</h2>
            <p>Search for a topic to discover research papers</p>
          </div>
        ) : (
          <div className="no-papers">
            <h2>🎉 All caught up!</h2>
            <p>Liked: {paperState.likedPapers.length}, Disliked: {paperState.dislikedPapers. length}</p>
            <button onClick={restartSearch} className="restart-btn">
              Search Again
            </button>
          </div>
        )}
      </div>

      {currentPaper && (
        <div className="action-buttons">
          <button className="action-btn dislike" onClick={() => handleDecision('dislike')}>
            ✕
          </button>
          <button className="action-btn like" onClick={() => handleDecision('like')}>
            ♥
          </button>
        </div>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={closeExportModal}
        papers={paperState.likedPapers}
      />

      {showArchivePage && (
        <ArchivePage
          archivedPapers={paperState.archivedPapers}
          onClose={closeArchivePage}
          onDeleteFolder={deleteFolder}
        />
      )}
    </div>
  );
}

export default App;
