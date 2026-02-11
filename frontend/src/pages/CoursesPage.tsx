import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MoveLeft, Loader2, SlidersHorizontal, X } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import api from "@/api/axiosInstance";

interface Course {
  id: number;
  name: string;
  description: string;
  kitId: number | null;
  difficulty?: string;
  categoryName?: string;
}

interface Category {
  categoryId: number;
  name: string;
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  
  // Filter state from URL
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [minDuration, setMinDuration] = useState(searchParams.get('minDuration') || '');
  const [maxDuration, setMaxDuration] = useState(searchParams.get('maxDuration') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'asc');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') !== 'false');

  const pageSize = 12;

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories', { params: { page: 1, pageSize: 100 } });
        setCategories(response.data.items || response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Build filter params
  const getFilterParams = (page: number = 1) => {
    const params: any = { page, pageSize };
    if (selectedCategory) params.categoryId = selectedCategory;
    if (difficulty) params.difficulty = difficulty;
    if (minDuration) params.minDuration = minDuration;
    if (maxDuration) params.maxDuration = maxDuration;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (isActive) params.isActive = isActive;
    return params;
  };

  // Update URL with current filters
  const updateURL = () => {
    const params: any = {};
    if (selectedCategory) params.categoryId = selectedCategory;
    if (difficulty) params.difficulty = difficulty;
    if (minDuration) params.minDuration = minDuration;
    if (maxDuration) params.maxDuration = maxDuration;
    if (sortBy !== 'name' || sortOrder !== 'asc') {
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
    }
    if (!isActive) params.isActive = 'false';
    setSearchParams(params);
  };

  // Fetch courses
  const fetchCourses = async (page: number, append: boolean = false) => {
    try {
      setLoading(true);
      const response = await api.get('/courses', { params: getFilterParams(page) });
      const data = response.data;
      
      const newCourses = data.items.map((c: any) => ({
        id: c.courseId || c.Id || c.id,
        name: c.name || c.Name,
        description: c.description || c.Description,
        difficulty: c.difficulty,
        categoryName: c.category?.name,
        kitId: c.kits && c.kits.length > 0 ? (c.kits[0].kitId || c.kits[0].id) : null
      }));

      if (append) {
        setCourses(prev => [...prev, ...newCourses]);
      } else {
        setCourses(newCourses);
      }

      setTotalCount(data.totalCount);
      setHasMore(newCourses.length + (append ? courses.length : 0) < data.totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    fetchCourses(1, false);
    updateURL();
  }, [selectedCategory, difficulty, minDuration, maxDuration, sortBy, sortOrder, isActive]);

  // Load more handler
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchCourses(currentPage + 1, true);
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setSelectedCategory('');
    setDifficulty('');
    setMinDuration('');
    setMaxDuration('');
    setSortBy('name');
    setSortOrder('asc');
    setIsActive(true);
    setSearchParams({});
  };

  // Count active filters
  const activeFilterCount = [
    selectedCategory,
    difficulty,
    minDuration,
    maxDuration,
    !isActive
  ].filter(Boolean).length;

  // Get active filter chips
  const activeFilters = [];
  if (selectedCategory) {
    const category = categories.find(c => c.categoryId.toString() === selectedCategory);
    activeFilters.push({ label: `Category: ${category?.name}`, clear: () => setSelectedCategory('') });
  }
  if (difficulty) {
    activeFilters.push({ label: `Difficulty: ${difficulty}`, clear: () => setDifficulty('') });
  }
  if (minDuration) {
    activeFilters.push({ label: `Min: ${minDuration}min`, clear: () => setMinDuration('') });
  }
  if (maxDuration) {
    activeFilters.push({ label: `Max: ${maxDuration}min`, clear: () => setMaxDuration('') });
  }
  if (!isActive) {
    activeFilters.push({ label: 'Including inactive', clear: () => setIsActive(true) });
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      {/* Filter Sidebar */}
      <FilterSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        difficulty={difficulty}
        minDuration={minDuration}
        maxDuration={maxDuration}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isActive={isActive}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setDifficulty}
        onMinDurationChange={setMinDuration}
        onMaxDurationChange={setMaxDuration}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
        onActiveChange={setIsActive}
        onClearAll={handleClearAll}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="hover:bg-neutral-800 p-2 rounded-full transition-all"
          >
            <MoveLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Courses</h1>
            <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">Academic Catalog</p>
          </div>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="bg-white text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map((filter, index) => (
              <button
                key={index}
                onClick={filter.clear}
                className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-purple-900/50 transition-colors"
              >
                {filter.label}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 text-sm text-neutral-400">
          {loading && courses.length === 0 ? (
            'Loading...'
          ) : (
            `Showing ${courses.length} of ${totalCount} courses`
          )}
        </div>

        {/* Courses Grid */}
        {loading && courses.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-white" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
            <p className="text-neutral-500 uppercase tracking-widest text-sm mb-4">
              No courses found matching your filters
            </p>
            <Button
              onClick={handleClearAll}
              className="bg-white text-black hover:bg-neutral-200"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Card 
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="bg-neutral-950 border-neutral-800 rounded-3xl overflow-hidden flex flex-col border-t-4 border-t-neutral-700 shadow-2xl cursor-pointer hover:border-t-white transition-all"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-white uppercase tracking-tight leading-tight">
                      {course.name}
                    </CardTitle>
                    {(course.categoryName || course.difficulty) && (
                      <div className="flex gap-2 mt-2">
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
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {course.description}
                    </p>

                    <div className="space-y-3 pt-4 border-t border-neutral-900">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Required Hardware</p>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/kits/${course.kitId}`);
                        }}
                        disabled={!course.kitId}
                        className="w-full bg-black text-white border border-neutral-800 hover:bg-white hover:text-black font-black rounded-xl flex items-center justify-center gap-2 py-6 transition-all duration-300"
                      >
                        <Package className="w-5 h-5" />
                        {course.kitId ? "GET LINKED KIT" : "NO KIT REQUIRED"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white text-black hover:bg-neutral-200 font-black uppercase px-8 py-6 rounded-2xl border-2 border-white transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}