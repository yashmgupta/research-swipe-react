import { memo, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './SwipeCard.css';

const SwipeCard = memo(function SwipeCard({ paper, onDecision }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [40, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-40, -120], [0, 1]);

  const handleDragEnd = useCallback((event, info) => {
    if (info.offset.x > 120) {
      onDecision('like');
    } else if (info.offset.x < -120) {
      onDecision('dislike');
    }
  }, [onDecision]);

  return (
    <motion. div
      className="swipe-card"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.2 }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <motion.div className="card-badge like-badge" style={{ opacity: likeOpacity }}>
        LIKE
      </motion.div>
      <motion.div className="card-badge nope-badge" style={{ opacity:  nopeOpacity }}>
        NOPE
      </motion. div>

      <div className="card-content">
        <h2 className="card-title">{paper.title}</h2>
        <div className="card-authors">👥 {paper.authors}</div>
        <div className="card-year">
          📅 {paper.year}
          {paper.citations > 0 && ` | 📚 ${paper.citations. toLocaleString()} citations`}
        </div>
        {paper.venue && paper.venue !== 'Unknown venue' && (
          <div className="card-venue">📍 {paper.venue}</div>
        )}
        {paper.isOpenAccess && (
          <div className="card-open-access">🔓 Open Access</div>
        )}
        {paper.concepts && paper.concepts.length > 0 && (
          <div className="card-concepts">
            {paper.concepts.slice(0, 3).map((concept, idx) => (
              <span key={idx} className="concept-tag">{concept}</span>
            ))}
          </div>
        )}
        <div className="card-abstract">{paper.abstract}</div>
        {paper.pdfUrl && (
          <div className="card-pdf">
            <a href={paper. pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              📄 Open Access PDF
            </a>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="card-source">
          OpenAlex
          {paper.url && paper.url !== '#' && (
            <>
              {' | '}
              <a href={paper.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                View Paper
              </a>
            </>
          )}
        </div>
      </div>
    </motion. div>
  );
});

export default SwipeCard;
