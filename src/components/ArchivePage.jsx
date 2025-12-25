import { useState, useCallback, memo, useMemo } from 'react';
import { X, FolderOpen, FileText, Trash2 } from 'lucide-react';
import './ArchivePage.css';

const PaperItem = memo(function PaperItem({ paper, isExpanded, onToggle }) {
  return (
    <div
      className={`paper-item ${isExpanded ? 'expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="paper-item-header">
        <FileText size={16} />
        <h4>{paper.title}</h4>
      </div>
      <div className="paper-item-meta">
        <span>👥 {paper.authors}</span>
        <span>📅 {paper.year}</span>
        <span>📚 {(paper.citations || 0).toLocaleString()} citations</span>
      </div>
      {isExpanded && (
        <div className="paper-item-details">
          {paper.venue && <p><strong>Venue:</strong> {paper.venue}</p>}
          <p><strong>Abstract:</strong> {paper.abstract}</p>
          <div className="paper-item-links">
            {paper.url && paper.url !== '#' && (
              <a href={paper.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                🔗 View Paper
              </a>
            )}
            {paper.pdfUrl && (
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                📄 PDF
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

const FolderCard = memo(function FolderCard({ folderName, paperCount, onSelect, onDelete }) {
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (confirm(`Delete folder "${folderName}"? `)) {
      onDelete(folderName);
    }
  }, [folderName, onDelete]);

  return (
    <div
      className="folder-card"
      onClick={() => onSelect(folderName)}
    >
      <div className="folder-icon">📁</div>
      <div className="folder-info">
        <h3>{folderName}</h3>
        <p>{paperCount} paper{paperCount !== 1 ?  's' : ''}</p>
      </div>
      <button
        className="folder-delete-btn"
        onClick={handleDelete}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});

const ArchivePage = memo(function ArchivePage({ archivedPapers, onClose, onDeleteFolder }) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [expandedPaper, setExpandedPaper] = useState(null);

  const folders = useMemo(() => Object.keys(archivedPapers), [archivedPapers]);

  const totalPapers = useMemo(() =>
    Object.values(archivedPapers).reduce((sum, papers) => sum + papers.length, 0),
    [archivedPapers]
  );

  const handleBackToFolders = useCallback(() => {
    setSelectedFolder(null);
    setExpandedPaper(null);
  }, []);

  const handleDeleteSelectedFolder = useCallback(() => {
    if (selectedFolder && confirm(`Delete folder "${selectedFolder}" and all papers inside?`)) {
      onDeleteFolder(selectedFolder);
      setSelectedFolder(null);
    }
  }, [selectedFolder, onDeleteFolder]);

  const handleTogglePaper = useCallback((idx) => {
    setExpandedPaper(prev => prev === idx ? null : idx);
  }, []);

  return (
    <div className="archive-page-overlay">
      <div className="archive-page">
        <div className="archive-header">
          <div className="archive-title">
            <FolderOpen size={24} />
            <h2>Archive</h2>
          </div>
          <button className="archive-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="archive-content">
          {folders.length === 0 ? (
            <div className="archive-empty">
              <FolderOpen size={48} style={{ opacity: 0.3 }} />
              <p>No archived papers yet</p>
              <p className="archive-empty-hint">Like papers to auto-archive them by topic</p>
            </div>
          ) : selectedFolder ? (
            <div className="folder-view">
              <div className="folder-header">
                <button className="back-btn" onClick={handleBackToFolders}>
                  ← Back to Folders
                </button>
                <h3>📂 {selectedFolder}</h3>
                <button
                  className="delete-folder-btn"
                  onClick={handleDeleteSelectedFolder}
                >
                  <Trash2 size={16} /> Delete Folder
                </button>
              </div>

              <div className="folder-papers">
                {(archivedPapers[selectedFolder] || []).map((paper, idx) => (
                  <PaperItem
                    key={paper.id || idx}
                    paper={paper}
                    isExpanded={expandedPaper === idx}
                    onToggle={() => handleTogglePaper(idx)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="folders-grid">
              {folders.map((folderName) => (
                <FolderCard
                  key={folderName}
                  folderName={folderName}
                  paperCount={archivedPapers[folderName]. length}
                  onSelect={setSelectedFolder}
                  onDelete={onDeleteFolder}
                />
              ))}
            </div>
          )}
        </div>

        <div className="archive-footer">
          <div className="archive-stats">
            <div className="stat-item">
              <strong>{folders.length}</strong>
              <span>Folder{folders.length !== 1 ?  's' : ''}</span>
            </div>
            <div className="stat-item">
              <strong>{totalPapers}</strong>
              <span>Total Paper{totalPapers !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ArchivePage;
