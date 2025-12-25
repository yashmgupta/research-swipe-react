/**
 * OpenAlex Service Layer
 * Drop-in replacement for Semantic Scholar with caching, batching, and streaming
 */

const OPENALEX_BASE = 'https://api.openalex.org';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class OpenAlexService {
  constructor() {
    this.cache = new Map();
    this.abortController = null;
    this.politeEmail = 'yash.610@live.com'; // Your email for faster rate limits
  }

  /**
   * Build API URL with polite pool access
   */
  buildUrl(endpoint, params = {}) {
    const url = new URL(`${OPENALEX_BASE}${endpoint}`);
    url.searchParams.set('mailto', this.politeEmail);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  }

  /**
   * Get cache key for a query
   */
  getCacheKey(topic, page, perPage) {
    return `${topic}: ${page}:${perPage}`;
  }

  /**
   * Check if cache entry is valid
   */
  isCacheValid(entry) {
    return entry && (Date.now() - entry.timestamp) < CACHE_TTL;
  }

  /**
   * Cancel any in-flight requests
   */
  cancelPendingRequests() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    return this.abortController.signal;
  }

  /**
   * Search papers with instant cache + progressive loading
   */
  async searchPapers(topic, options = {}) {
    const {
      page = 1,
      perPage = 25,
      sortBy = 'cited_by_count: desc',
      onCacheHit = null,
      onFreshData = null,
      onError = null
    } = options;

    const cacheKey = this.getCacheKey(topic, page, perPage);
    const signal = this.cancelPendingRequests();

    // Instant return from cache
    const cached = this.cache.get(cacheKey);
    if (this.isCacheValid(cached)) {
      if (onCacheHit) {
        onCacheHit(cached. data);
      }
    }

    // Fetch fresh data in background
    try {
      const url = this.buildUrl('/works', {
        search: topic,
        page,
        per_page: perPage,
        sort: sortBy,
        select: 'id,display_name,authorships,publication_year,cited_by_count,abstract_inverted_index,primary_location,open_access,concepts'
      });

      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`);
      }

      const data = await response.json();
      const papers = this.transformResults(data.results || [], topic);

      // Update cache
      this.cache.set(cacheKey, {
        data: papers,
        meta: data.meta,
        timestamp: Date.now()
      });

      if (onFreshData) {
        onFreshData(papers, data.meta);
      }
      return papers;

    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Request was cancelled
      }
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * Prefetch next page in background
   */
  async prefetchNextPage(topic, currentPage, perPage = 25) {
    const nextPage = currentPage + 1;
    const cacheKey = this.getCacheKey(topic, nextPage, perPage);

    // Skip if already cached
    if (this.isCacheValid(this. cache.get(cacheKey))) {
      return;
    }

    // Low-priority fetch
    try {
      await this.searchPapers(topic, {
        page: nextPage,
        perPage,
        onFreshData: () => {}, // Silent prefetch
      });
    } catch {
      // Ignore prefetch errors
    }
  }

  /**
   * Transform OpenAlex results to app format
   */
  transformResults(results, topic) {
    return results.map((work) => ({
      id: work.id || Math.random().toString(36).substr(2, 9),
      title: work.display_name || 'No title',
      authors: this.extractAuthors(work.authorships),
      year: work.publication_year || 'N/A',
      abstract: this.reconstructAbstract(work.abstract_inverted_index),
      citations: work.cited_by_count || 0,
      url: work.id || '#',
      pdfUrl: work.open_access?. oa_url || null,
      venue: work.primary_location?.source?. display_name || 'Unknown venue',
      topic,
      concepts: work.concepts?. slice(0, 5).map(c => c.display_name) || [],
      isOpenAccess: work.open_access?. is_oa || false
    }));
  }

  /**
   * Extract author names
   */
  extractAuthors(authorships) {
    if (!authorships?. length) return 'Unknown';
    const names = authorships
      .slice(0, 5)
      .map(a => a.author?.display_name)
      .filter(Boolean);
    
    if (names.length === 0) return 'Unknown';
    return names.join(', ') + (authorships.length > 5 ? ' et al.' : '');
  }

  /**
   * Reconstruct abstract from inverted index
   */
  reconstructAbstract(invertedIndex) {
    if (!invertedIndex) return 'No abstract available';

    const words = [];
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      positions.forEach(pos => {
        words[pos] = word;
      });
    });
    return words.join(' ') || 'No abstract available';
  }

  /**
   * Get related papers based on concepts
   */
  async getRelatedPapers(concepts, excludeIds = []) {
    if (!concepts || concepts.length === 0) {
      return [];
    }

    const conceptFilter = concepts.slice(0, 3).map(c =>
      `concepts. display_name:${encodeURIComponent(c)}`
    ).join('|');

    const url = this.buildUrl('/works', {
      filter: conceptFilter,
      per_page: 10,
      sort: 'cited_by_count:desc'
    });

    try {
      const response = await fetch(url);
      const data = await response.json();

      return this.transformResults(
        (data.results || []).filter(w => !excludeIds.includes(w.id)),
        'related'
      );
    } catch {
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const openAlexService = new OpenAlexService();
export default openAlexService;
