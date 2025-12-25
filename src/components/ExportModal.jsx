import { useState, useCallback, memo } from 'react';
import { X } from 'lucide-react';
import './ExportModal.css';

const ExportModal = memo(function ExportModal({ isOpen, onClose, papers }) {
  const [activeTab, setActiveTab] = useState('json');

  const downloadFile = useCallback((content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback(() => {
    const data = JSON.stringify(papers, null, 2);
    downloadFile(data, 'liked_papers.json', 'application/json');
  }, [papers, downloadFile]);

  const exportCSV = useCallback(() => {
    const headers = ['Title', 'Authors', 'Year', 'Citations', 'Venue', 'URL', 'PDF URL', 'Abstract'];
    const rows = papers.map(paper => [
      `"${(paper.title || '').replace(/"/g, '""')}"`,
      `"${(paper.authors || '').replace(/"/g, '""')}"`,
      paper.year || '',
      paper.citations || 0,
      `"${(paper.venue || '').replace(/"/g, '""')}"`,
      paper.url || '',
      paper. pdfUrl || '',
      `"${(paper.abstract || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers. join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, 'liked_papers. csv', 'text/csv');
  }, [papers, downloadFile]);

  const exportBibTeX = useCallback(() => {
    let bibtex = '';
    papers. forEach((paper, i) => {
      const key = `paper${i + 1}_${paper.year || 'unknown'}`;
      bibtex += `@article{${key},\n`;
      bibtex += `  title = {${paper.title || 'Unknown'}},\n`;
      bibtex += `  author = {${paper.authors || 'Unknown'}},\n`;
      bibtex += `  year = {${paper.year || 'Unknown'}},\n`;
      if (paper.venue) bibtex += `  journal = {${paper.venue}},\n`;
      if (paper.url) bibtex += `  url = {${paper.url}},\n`;
      bibtex += `  note = {Citations: ${paper.citations || 0}}\n`;
      bibtex += `}\n\n`;
    });
    downloadFile(bibtex, 'references.bib', 'text/plain');
  }, [papers, downloadFile]);

  const exportEndNote = useCallback(() => {
    let endnote = '';
    papers.forEach((paper) => {
      endnote += `%0 Journal Article\n`;
      endnote += `%T ${paper.title || 'Unknown'}\n`;
      const authors = (paper.authors || 'Unknown').split(', ');
      authors.forEach((author) => {
        endnote += `%A ${author}\n`;
      });
      endnote += `%D ${paper.year || 'Unknown'}\n`;
      if (paper.venue) endnote += `%J ${paper.venue}\n`;
      if (paper.abstract) endnote += `%X ${paper.abstract}\n`;
      if (paper.url) endnote += `%U ${paper.url}\n`;
      endnote += `%Z Citations: ${paper.citations || 0}\n\n`;
    });
    downloadFile(endnote, 'references.enw', 'text/plain');
  }, [papers, downloadFile]);

  const exportText = useCallback(() => {
    let text = '=== LIKED RESEARCH PAPERS ===\n\n';
    papers.forEach((paper, i) => {
      text += `${i + 1}. ${paper.title || 'Unknown'}\n`;
      text += `   Authors: ${paper.authors || 'Unknown'}\n`;
      text += `   Year: ${paper.year || 'Unknown'}\n`;
      text += `   Citations: ${paper.citations || 0}\n`;
      if (paper.venue) text += `   Venue: ${paper.venue}\n`;
      if (paper.url) text += `   URL: ${paper.url}\n`;
      if (paper.pdfUrl) text += `   PDF: ${paper.pdfUrl}\n`;
      text += `\n`;
    });
    downloadFile(text, 'liked_papers.txt', 'text/plain');
  }, [papers, downloadFile]);

  if (!isOpen) return null;

  const tabs = [
    { id:  'json', label: 'JSON', free: true },
    { id:  'csv', label: 'CSV', free: true },
    { id: 'bibtex', label: 'BibTeX', free: true },
    { id: 'endnote', label: 'EndNote', free: true },
    { id: 'text', label:  'Text', free: true }
  ];

  const handleExport = () => {
    switch (activeTab) {
      case 'json':
        exportJSON();
        break;
      case 'csv':
        exportCSV();
        break;
      case 'bibtex': 
        exportBibTeX();
        break;
      case 'endnote':
        exportEndNote();
        break;
      case 'text':
        exportText();
        break;
      default:
        break;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Papers ({papers.length})</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab. id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {papers.length === 0 ? (
            <div className="empty-export">
              <p>No liked papers to export yet.</p>
              <p>Swipe right on papers you like!</p>
            </div>
          ) : (
            <div className="export-preview">
              <p>Ready to export {papers.length} paper{papers.length !== 1 ? 's' :  ''} as {activeTab. toUpperCase()}</p>
              <button className="export-btn" onClick={handleExport}>
                Download {activeTab.toUpperCase()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ExportModal;
