import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/api/axiosInstance';

interface SearchResults {
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

type TabType = 'all' | 'courses' | 'kits';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const urlType = searchParams.get('type') as TabType || 'all';

  const [activeTab, setActiveTab] = useState<TabType>(urlType);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coursesPage, setCoursesPage] = useState(1);
  const [kitsPage, setKitsPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageSize = 12;

  useEffect(() => {
    if (urlType !== activeTab) {
      setActiveTab(urlType);
    }
  }, [urlType]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    fetchResults(1, 1, activeTab);
  }, [query, activeTab]);

  const fetchResults = async (coursePage: number, kitPage: number, type: TabType) => {
    try {
      setLoading(coursePage === 1 && kitPage === 1);
      setError(null);

      const response = await api.get('/search', {
        params: {
          q: query,
          type: type,
          page: type === 'courses' ? coursePage : kitPage,
          pageSize: pageSize
        }
      });

      if (coursePage === 1 && kitPage === 1) {
        setResults(response.data);
        setCoursesPage(1);
        setKitsPage(1);
      } else {
        // Append results for load more
        setResults(prev => {
          if (!prev) return response.data;
          
          return {
            ...prev,
            courses: {
              ...prev.courses,
              items: coursePage > 1 
                ? [...prev.courses.items, ...response.data.courses.items]
                : response.data.courses.items
            },
            kits: {
              ...prev.kits,
              items: kitPage > 1
                ? [...prev.kits.items, ...response.data.kits.items]
                : response.data.kits.items
            }
          };
        });
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ q: query, type: tab });
    setCoursesPage(1);
    setKitsPage(1);
  };

  const handleLoadMoreCourses = () => {
    const nextPage = coursesPage + 1;
    setCoursesPage(nextPage);
    setLoadingMore(true);
    fetchResults(nextPage, kitsPage, activeTab);
  };

  const handleLoadMoreKits = () => {
    const nextPage = kitsPage + 1;
    setKitsPage(nextPage);
    setLoadingMore(true);
    fetchResults(coursesPage, nextPage, activeTab);
  };

  const highlightText = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit">{part}</mark>
        : part
    );
  };

  if (query.trim().length < 2) {
    return (
      <div className="min-h-screen bg-black p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-neutral-600 mb-4" />
            <p className="text-xl text-neutral-400">Please enter at least 2 characters to search</p>
          </div>
        </div>
      </div>
    );
  }

  const showCourses = activeTab === 'all' || activeTab === 'courses';
  const showKits = activeTab === 'all' || activeTab === 'kits';
  const coursesRemaining = results ? results.courses.totalCount - results.courses.items.length : 0;
  const kitsRemaining = results ? results.kits.totalCount - results.kits.items.length : 0;

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-3">
            Search results for '{query}'
          </h1>
          
          {results && !loading && (
            <p className="text-neutral-400">
              Found {results.courses.totalCount} courses and {results.kits.totalCount} kits
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-neutral-800">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'all'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange('courses')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'courses'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Courses {results && `(${results.courses.totalCount})`}
          </button>
          <button
            onClick={() => handleTabChange('kits')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'kits'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Kits {results && `(${results.kits.totalCount})`}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-neutral-400">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results && (
          <>
            {/* Empty State */}
            {results.courses.totalCount === 0 && results.kits.totalCount === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className="w-16 h-16 text-neutral-600 mb-4" />
                <p className="text-xl text-neutral-400 mb-2">
                  No results found for '{query}'
                </p>
                <p className="text-neutral-500">Try a different search term</p>
              </div>
            )}

            {/* Courses Section */}
            {showCourses && results.courses.totalCount > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.courses.items.map((course: any) => (
                    <Card
                      key={course.courseId}
                      onClick={() => navigate(`/courses/${course.courseId}`)}
                      className="bg-neutral-900 border-neutral-800 hover:border-purple-500 cursor-pointer transition-all hover:scale-105"
                    >
                      <CardHeader>
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.name}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-purple-900 to-neutral-900 rounded-lg mb-4 flex items-center justify-center">
                            <Search className="w-12 h-12 text-neutral-600" />
                          </div>
                        )}
                        <CardTitle className="text-white">
                          {highlightText(course.name)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {course.categoryName && (
                            <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                              {course.categoryName}
                            </span>
                          )}
                          {course.difficulty && (
                            <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded">
                              {course.difficulty}
                            </span>
                          )}
                        </div>
                        {course.durationMinutes > 0 && (
                          <p className="text-sm text-neutral-400">
                            Duration: {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {coursesRemaining > 0 && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMoreCourses}
                      disabled={loadingMore}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More Courses (${coursesRemaining} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Kits Section */}
            {showKits && results.kits.totalCount > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Kits</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.kits.items.map((kit: any) => (
                    <Card
                      key={kit.kitId}
                      onClick={() => navigate(`/kits/${kit.kitId}`)}
                      className="bg-neutral-900 border-neutral-800 hover:border-purple-500 cursor-pointer transition-all hover:scale-105"
                    >
                      <CardHeader>
                        {kit.imageUrl ? (
                          <img
                            src={kit.imageUrl}
                            alt={kit.name}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-green-900 to-neutral-900 rounded-lg mb-4 flex items-center justify-center">
                            <Search className="w-12 h-12 text-neutral-600" />
                          </div>
                        )}
                        <CardTitle className="text-white">
                          {highlightText(kit.name)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {kit.courseName && (
                          <p className="text-sm text-neutral-400 mb-3">
                            For: {kit.courseName}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-white">
                            ₹{kit.price}
                          </span>
                          {kit.stockQuantity > 0 ? (
                            <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {kitsRemaining > 0 && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMoreKits}
                      disabled={loadingMore}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More Kits (${kitsRemaining} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
