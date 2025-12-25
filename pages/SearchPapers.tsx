import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, ExternalLink, AlertCircle, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// n8n webhook URL for paper search workflow
const N8N_SEARCH_WEBHOOK_URL = import.meta.env.VITE_N8N_SEARCH_WEBHOOK_URL || '';

interface SearchResult {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    url: string;
    source: string;
    publishedDate?: string;
    doi?: string;
    citationCount?: number;
}

// Session storage keys
const STORAGE_KEY_QUERY = 'search-papers-query';
const STORAGE_KEY_RESULTS = 'search-papers-results';
const STORAGE_KEY_HAS_SEARCHED = 'search-papers-has-searched';
const STORAGE_KEY_PAGE = 'search-papers-page';

const PAPERS_PER_PAGE = 10;

export const SearchPapers: React.FC = () => {
    const { user } = useAuth();

    // Initialize state from sessionStorage
    const [query, setQuery] = useState(() => {
        return sessionStorage.getItem(STORAGE_KEY_QUERY) || '';
    });
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY_RESULTS);
        return saved ? JSON.parse(saved) : [];
    });
    const [hasSearched, setHasSearched] = useState(() => {
        return sessionStorage.getItem(STORAGE_KEY_HAS_SEARCHED) === 'true';
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY_PAGE);
        return saved ? parseInt(saved, 10) : 1;
    });
    const [error, setError] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<unknown>(null);
    const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
    const [savingPaperId, setSavingPaperId] = useState<string | null>(null);

    // Persist search state to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_QUERY, query);
    }, [query]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
    }, [results]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_HAS_SEARCHED, hasSearched.toString());
    }, [hasSearched]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_PAGE, currentPage.toString());
    }, [currentPage]);

    // Track if scroll should happen after page change
    const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

    // Scroll to top after page change and re-render
    useEffect(() => {
        if (shouldScrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setShouldScrollToTop(false);
        }
    }, [shouldScrollToTop, currentPage]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        setShouldScrollToTop(true);
    };

    // Load saved paper IDs on mount
    useEffect(() => {
        const loadSavedPapers = async () => {
            if (!user) return;

            const { data } = await supabase
                .from('saved_papers')
                .select('openalex_id')
                .eq('user_id', user.id);

            if (data) {
                setSavedPaperIds(new Set(data.map(p => p.openalex_id)));
            }
        };

        loadSavedPapers();
    }, [user]);

    const handleSavePaper = async (paper: SearchResult) => {
        if (!user) return;

        setSavingPaperId(paper.id);

        try {
            if (savedPaperIds.has(paper.id)) {
                // Unsave the paper
                const { error } = await supabase
                    .from('saved_papers')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('openalex_id', paper.id);

                if (error) throw error;

                setSavedPaperIds(prev => {
                    const next = new Set(prev);
                    next.delete(paper.id);
                    return next;
                });
            } else {
                // Save the paper
                const { error } = await supabase
                    .from('saved_papers')
                    .insert({
                        user_id: user.id,
                        openalex_id: paper.id,
                        title: paper.title,
                        authors: paper.authors,
                        abstract: paper.abstract,
                        url: paper.url,
                        source: paper.source,
                        published_date: paper.publishedDate || null,
                        doi: paper.doi || null,
                        citation_count: paper.citationCount || null,
                    });

                if (error) throw error;

                setSavedPaperIds(prev => new Set(prev).add(paper.id));
            }
        } catch (err) {
            console.error('Error saving paper:', err);
        } finally {
            setSavingPaperId(null);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setHasSearched(true);
        setError(null);
        setRawResponse(null);
        setCurrentPage(1); // Reset to first page on new search

        try {
            // Use Vite proxy in development to avoid CORS
            const webhookUrl = import.meta.env.DEV
                ? '/api/n8n-search'
                : N8N_SEARCH_WEBHOOK_URL;

            if (!webhookUrl && !import.meta.env.DEV) {
                throw new Error('Search webhook URL not configured. Add VITE_N8N_SEARCH_WEBHOOK_URL to your .env file.');
            }

            console.log('Calling n8n search webhook:', webhookUrl);
            console.log('Search query:', query);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query.trim(),
                }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Search webhook error:', response.status, errorText);
                throw new Error(`Search failed (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log('Search response:', data);
            setRawResponse(data);

            // Parse the response - adapt based on your n8n workflow output format
            const papers = parseSearchResults(data);
            setResults(papers);

        } catch (err) {
            console.error('Search error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while searching');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Parse n8n response into SearchResult format
    // Adjust this based on your actual n8n workflow output structure
    const parseSearchResults = (data: unknown): SearchResult[] => {
        console.log('Parsing search results:', data);

        // Handle different response formats from n8n
        let papers: unknown[] = [];

        if (Array.isArray(data)) {
            papers = data;
        } else if (data && typeof data === 'object') {
            // Check common response wrapper formats
            const obj = data as Record<string, unknown>;
            if (Array.isArray(obj.papers)) {
                papers = obj.papers;
            } else if (Array.isArray(obj.results)) {
                papers = obj.results;
            } else if (Array.isArray(obj.data)) {
                papers = obj.data;
            } else {
                // Single result or nested structure
                papers = [data];
            }
        }

        return papers.map((paper: unknown, index: number) => {
            const p = paper as Record<string, unknown>;
            return {
                id: (p.id as string) || `paper-${index}`,
                title: (p.title as string) || 'Untitled',
                authors: Array.isArray(p.authors)
                    ? p.authors as string[]
                    : typeof p.authors === 'string'
                        ? (p.authors as string).split(/,\s*/)
                        : [],
                abstract: (p.abstract as string) || (p.summary as string) || (p.description as string) || '',
                url: (p.url as string) || (p.link as string) || '#',
                source: (p.source as string) || 'Unknown',
                publishedDate: (p.publishedDate as string) || (p.date as string) || (p.year as string) || undefined,
                doi: (p.doi as string) || undefined,
                citationCount: (p.citationCount as number) || undefined,
            };
        }).filter(p => p.title !== 'Untitled' || p.abstract);
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="font-display text-4xl font-bold text-charcoal mb-3">
                    Find Research Papers
                </h1>
                <p className="text-gray-500 text-lg">
                    Search for papers by keyword, topic, or research question
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-12">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter keywords or a research topic..."
                        className="w-full px-6 py-4 pl-14 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all"
                        disabled={isSearching}
                    />
                    <Search
                        size={24}
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !query.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-sage text-white font-medium rounded-xl hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isSearching ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </button>
                </div>
            </form>

            {/* Results Section */}
            {isSearching && (
                <div className="text-center py-20">
                    <Loader2 size={48} className="mx-auto text-sage animate-spin mb-4" />
                    <p className="text-gray-500">Searching for papers...</p>
                    <p className="text-gray-400 text-sm mt-2">This may take a moment...</p>
                </div>
            )}

            {/* Error State */}
            {!isSearching && error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-red-700 font-medium">Search Error</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Debug: Raw Response (temporary - remove in production) */}
            {!isSearching && rawResponse && results.length === 0 && !error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"
                >
                    <p className="text-amber-700 font-medium mb-2">Response received but no papers parsed</p>
                    <p className="text-amber-600 text-sm mb-3">Raw response from n8n workflow:</p>
                    <pre className="bg-white p-4 rounded-lg text-xs overflow-auto max-h-64 text-gray-700">
                        {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                </motion.div>
            )}

            {!isSearching && hasSearched && results.length === 0 && !error && !rawResponse && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-gray-50 rounded-2xl"
                >
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No papers found</p>
                    <p className="text-gray-400 text-sm">
                        Try different keywords or broaden your search
                    </p>
                </motion.div>
            )}

            {!isSearching && results.length > 0 && (() => {
                const totalPages = Math.ceil(results.length / PAPERS_PER_PAGE);
                const startIndex = (currentPage - 1) * PAPERS_PER_PAGE;
                const endIndex = startIndex + PAPERS_PER_PAGE;
                const paginatedResults = results.slice(startIndex, endIndex);

                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-gray-500">
                                Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of {results.length} paper{results.length !== 1 ? 's' : ''}
                            </p>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Previous page"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-gray-600 px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Next page"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {paginatedResults.map((paper, idx) => (
                            <motion.div
                                key={paper.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <h3 className="font-display font-semibold text-lg text-charcoal mb-2 hover:text-sage transition-colors">
                                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                                        {paper.title}
                                        <ExternalLink size={16} className="flex-shrink-0 mt-1 text-gray-400" />
                                    </a>
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">
                                    {paper.authors.join(', ')}
                                    {paper.publishedDate && ` • ${paper.publishedDate}`}
                                </p>
                                <p className="text-gray-600 text-sm line-clamp-3">
                                    {paper.abstract}
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                            {paper.source}
                                        </span>
                                        {paper.citationCount !== undefined && paper.citationCount > 0 && (
                                            <span className="text-xs text-gray-500">
                                                {paper.citationCount} citations
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleSavePaper(paper)}
                                        disabled={savingPaperId === paper.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            savedPaperIds.has(paper.id)
                                                ? 'bg-sage/10 text-sage hover:bg-sage/20'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title={savedPaperIds.has(paper.id) ? 'Remove from saved' : 'Save paper'}
                                    >
                                        {savingPaperId === paper.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : savedPaperIds.has(paper.id) ? (
                                            <BookmarkCheck size={16} />
                                        ) : (
                                            <Bookmark size={16} />
                                        )}
                                        {savedPaperIds.has(paper.id) ? 'Saved' : 'Save'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {/* Bottom pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-6">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600 px-4">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Empty State - Before Search */}
            {!hasSearched && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-sage/10 rounded-full mb-6">
                        <Search size={32} className="text-sage" />
                    </div>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Enter a keyword, topic, or research question to discover relevant papers from various academic sources.
                    </p>
                </motion.div>
            )}
        </div>
    );
};
