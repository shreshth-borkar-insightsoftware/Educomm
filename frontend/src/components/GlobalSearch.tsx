import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/api/axiosInstance';

interface SearchResult {
  query: string;
  courses: {
    items: any[];
    totalCount: number;
  };
  kits: {
    items: any[];
    totalCount: number;
  };
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 400);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults(null);
        setShowDropdown(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await api.get('/search', {
          params: {
            q: debouncedQuery,
            type: 'all',
            pageSize: 5
          },
          signal: abortControllerRef.current.signal
        });
        setResults(response.data);
        setShowDropdown(true);
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error('Search error:', error);
          setResults(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleResultClick = (type: 'courses' | 'kits', id: number) => {
    const path = type === 'courses' ? `/courses/${id}` : `/kits/${id}`;
    navigate(path);
    setSearchQuery('');
    setShowDropdown(false);
    setResults(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleViewAll = (type: 'courses' | 'kits') => {
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${type}`);
    setSearchQuery('');
    setShowDropdown(false);
    setResults(null);
  };

  const hasResults = results && (results.courses.items.length > 0 || results.kits.items.length > 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search courses, kits..."
          className="w-full md:w-96 pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && debouncedQuery.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto transition-all duration-200 ease-in-out">
          {loading && !results ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Searching...</p>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {/* Courses Section */}
              {results.courses.items.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50">
                    <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Courses ({results.courses.totalCount})
                    </h3>
                  </div>
                  <div>
                    {results.courses.items.map((course: any) => (
                      <div
                        key={course.courseId}
                        onClick={() => handleResultClick('courses', course.courseId)}
                        className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate">
                              {course.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {course.categoryName && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                  {course.categoryName}
                                </span>
                              )}
                              {course.difficulty && (
                                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                  {course.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {results.courses.totalCount > 5 && (
                    <div
                      onClick={() => handleViewAll('courses')}
                      className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer font-medium"
                    >
                      View all {results.courses.totalCount} course results →
                    </div>
                  )}
                </div>
              )}

              {/* Kits Section */}
              {results.kits.items.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50">
                    <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Kits ({results.kits.totalCount})
                    </h3>
                  </div>
                  <div>
                    {results.kits.items.map((kit: any) => (
                      <div
                        key={kit.kitId}
                        onClick={() => handleResultClick('kits', kit.kitId)}
                        className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate">
                              {kit.name}
                            </p>
                            {kit.courseName && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                For: {kit.courseName}
                              </p>
                            )}
                          </div>
                          {kit.price > 0 && (
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                              ₹{kit.price}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {results.kits.totalCount > 5 && (
                    <div
                      onClick={() => handleViewAll('kits')}
                      className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer font-medium"
                    >
                      View all {results.kits.totalCount} kit results →
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">
                No results found for <span className="font-semibold">'{searchQuery}'</span>
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                Try different keywords or check your spelling
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
