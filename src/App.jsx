import { useState, useEffect } from 'react';
import './App.css';
import SwipeCard from './components/SwipeCard';
import ExportModal from './components/ExportModal';
import ArchivePage from './components/ArchivePage';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import { Download, Archive } from 'lucide-react';

function App() {
  const [papers, setPapers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPapers, setLikedPapers] = useState([]);
  const [dislikedPapers, setDislikedPapers] = useState([]);
  const [archivedPapers, setArchivedPapers] = useState({});
  const [currentTopic, setCurrentTopic] = useState('machine learning');
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showArchivePage, setShowArchivePage] = useState(false);

  const currentPaper = papers[currentIndex];
  const nextPaper = papers[currentIndex + 1];

  // Load papers from Semantic Scholar API
  const searchPapers = async (topic) => {
    setIsLoading(true);
    setCurrentTopic(topic);
    setOffset(0);
    setCurrentIndex(0);
    
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(topic)}&offset=0&limit=100&fields=title,authors,year,abstract,citationCount,publicationDate,url,openAccessPdf,venue`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to fetch papers');
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const formattedPapers = data.data.map((paper, idx) => ({
          id: idx,
          title: paper.title || 'No title',
          authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown',
          year: paper.year || paper.publicationDate?.substring(0, 4) || 'N/A',
          abstract: paper.abstract || 'No abstract available',
          citations: paper.citationCount || 0,
          url: paper.url || '#',
          pdfUrl: paper.openAccessPdf?.url || null,
          venue: paper.venue || 'Unknown venue',
          topic: topic
        }));
        
        setPapers(formattedPapers);
        setOffset(100);
      } else {
        alert('No papers found for this topic');
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      alert('Failed to load papers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = (decision) => {
    if (!currentPaper) return;
    
    if (decision === 'like') {
      setLikedPapers(prev => [...prev, currentPaper]);
      // Auto-archive to topic folder
      const folder = currentTopic || 'General';
      setArchivedPapers(prev => ({
        ...prev,
        [folder]: [...(prev[folder] || []), currentPaper]
      }));
    } else {
      setDislikedPapers(prev => [...prev, currentPaper]);
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  const archiveCurrent = () => {
    if (!currentPaper) return;
    
    const folderName = prompt(`Archive "${currentPaper.title}" to which folder?`, currentTopic || 'General');
    
    if (folderName) {
      setArchivedPapers(prev => ({
        ...prev,
        [folderName]: [...(prev[folderName] || []), currentPaper]
      }));
      alert(`✅ Paper archived to "${folderName}" folder!`);
    }
  };

  const openArchive = () => {
    setShowArchivePage(true);
  };

  const deleteFolder = (folderName) => {
    setArchivedPapers(prev => {
      const newArchived = { ...prev };
      delete newArchived[folderName];
      return newArchived;
    });
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>ResPart</h1>
        <p>Find your research partner</p>
      </div>

      <SearchBar onSearch={searchPapers} initialValue={currentTopic} />

      <Stats 
        liked={likedPapers.length}
        disliked={dislikedPapers.length}
        archived={Object.keys(archivedPapers).reduce((sum, key) => sum + archivedPapers[key].length, 0)}
      />

      <div className="card-container">
        {isLoading ? (
          <div className="loading">Loading papers...</div>
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
              paper={currentPaper}
              onDecision={handleDecision}
            />
            
            <div className="corner-actions">
              <button className="corner-btn" onClick={() => setShowExportModal(true)}>
                <Download size={16} /> Export
              </button>
              <button className="corner-btn" onClick={openArchive}>
                <Archive size={16} /> Archive
              </button>
            </div>
          </>
        ) : (
          <div className="no-papers">
            <h2>🎉 All caught up!</h2>
            <p>Liked: {likedPapers.length}, Disliked: {dislikedPapers.length}</p>
            <button onClick={() => searchPapers(currentTopic)} className="restart-btn">
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
        onClose={() => setShowExportModal(false)}
        papers={likedPapers}
      />

      {showArchivePage && (
        <ArchivePage
          archivedPapers={archivedPapers}
          onClose={() => setShowArchivePage(false)}
          onDeleteFolder={deleteFolder}
        />
      )}
    </div>
  );
}

export default App;
