import { useState, useCallback, useRef } from 'react';
import openAlexService from '../services/openAlexService';

/**
 * Optimized search hook with: 
 * - Instant cache results
 * - Progressive loading
 * - Automatic prefetching
 * - Request deduplication
 */
export function useOptimizedSearch(initialTopic = '') {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFreshLoading, setIsFreshLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(initialTopic);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const currentIndexRef = useRef(0);
  const seenIdsRef = useRef(new Set());
  const isLoadingMoreRef = useRef(false);

  /**
   * Search for papers - instant results from cache, fresh data in background
   */
  const search = useCallback(async (topic, reset = true) => {
    if (!topic. trim()) return;

    const searchPage = reset ? 1 : page;

    if (reset) {
      setPage(1);
      setPapers([]);
      seenIdsRef.current.clear();
      currentIndexRef.current = 0;
    }

    setCurrentTopic(topic);
    setError(null);
    setIsLoading(true);

    try {
      await openAlexService.searchPapers(topic, {
        page: searchPage,
        perPage: 25,

        // Instant results from cache
        onCacheHit: (cachedPapers) => {
          if (cachedPapers. length > 0) {
            setIsLoading(false);
            setPapers(prev => reset ? cachedPapers : [... prev, ...cachedPapers]);
            setIsFreshLoading(true); // Show subtle indicator for fresh fetch
          }
        },

        // Fresh data arrives
        onFreshData: (freshPapers, meta) => {
          const newPapers = freshPapers.filter(p => !seenIdsRef. current.has(p.id));
          newPapers.forEach(p => seenIdsRef.current.add(p.id));

          setPapers(prev => reset ? freshPapers : [...prev, ... newPapers]);
          setHasMore(meta && meta.count ?  meta.count > searchPage * 25 : false);
          setIsLoading(false);
          setIsFreshLoading(false);
          isLoadingMoreRef.current = false;

          // Prefetch next page
          if (meta && meta.count && meta.count > searchPage * 25) {
            openAlexService.prefetchNextPage(topic, searchPage);
          }
        },

        onError: (err) => {
          setError(err. message);
          setIsLoading(false);
          setIsFreshLoading(false);
          isLoadingMoreRef.current = false;
        }
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
      setIsLoading(false);
      setIsFreshLoading(false);
      isLoadingMoreRef.current = false;
    }
  }, [page]);

  /**
   * Load more papers (pagination)
   */
  const loadMore = useCallback(() => {
    if (! isLoadingMoreRef.current && ! isLoading && hasMore && currentTopic) {
      isLoadingMoreRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      
      // Directly call search with next page
      openAlexService.searchPapers(currentTopic, {
        page: nextPage,
        perPage: 25,
        onFreshData: (freshPapers, meta) => {
          const newPapers = freshPapers.filter(p => !seenIdsRef.current.has(p.id));
          newPapers.forEach(p => seenIdsRef.current. add(p.id));
          setPapers(prev => [...prev, ...newPapers]);
          setHasMore(meta && meta.count ? meta.count > nextPage * 25 : false);
          isLoadingMoreRef.current = false;
          
          // Prefetch next page
          if (meta && meta.count && meta.count > nextPage * 25) {
            openAlexService.prefetchNextPage(currentTopic, nextPage);
          }
        },
        onError: () => {
          isLoadingMoreRef.current = false;
        }
      });
    }
  }, [isLoading, hasMore, currentTopic, page]);

  /**
   * Get current paper with prefetch trigger
   */
  const getCurrentPaper = useCallback((index) => {
    currentIndexRef.current = index;

    // Prefetch more when 5 papers away from end
    if (papers.length - index <= 5 && hasMore && ! isLoading && !isLoadingMoreRef.current) {
      loadMore();
    }

    return papers[index] || null;
  }, [papers, hasMore, isLoading, loadMore]);

  /**
   * Reset the search state
   */
  const reset = useCallback(() => {
    setPapers([]);
    setPage(1);
    setError(null);
    setHasMore(true);
    seenIdsRef.current.clear();
    currentIndexRef.current = 0;
  }, []);

  return {
    papers,
    isLoading,
    isFreshLoading,
    error,
    currentTopic,
    hasMore,
    search,
    loadMore,
    getCurrentPaper,
    reset,
    totalCount: papers.length
  };
}

export default useOptimizedSearch;
