import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import apiClient from '@/api/axiosInstance';
import KitFilterSidebar from '@/components/KitFilterSidebar';
import FloatingCartButton from '@/components/FloatingCartButton';
import KitCard from '@/components/KitCard';

interface Course {
  courseId: number;
  name: string;
}

interface Kit {
  kitId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  course?: Course;
}

interface PaginatedResponse {
  items: Kit[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export default function KitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, fetchCart } = useCartStore();

  // Kits state
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [priceError, setPriceError] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Fetch courses for filter dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses', { params: { pageSize: 100 } });
        setCourses(response.data.items || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // Read filters from URL on mount
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');
    const stock = searchParams.get('inStock');
    const active = searchParams.get('isActive');
    const sort = searchParams.get('sortBy');
    const order = searchParams.get('sortOrder');

    if (courseId) setSelectedCourse(courseId);
    if (min) setMinPrice(min);
    if (max) setMaxPrice(max);
    if (stock === 'true') setInStock(true);
    if (active === 'false') setIsActive(false);
    if (sort) setSortBy(sort);
    if (order) setSortOrder(order);
  }, []);

  const getFilterParams = () => {
    const params: Record<string, any> = {
      page: currentPage,
      pageSize: 12,
    };

    if (selectedCourse) params.courseId = selectedCourse;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (inStock) params.inStock = true;
    if (isActive) params.isActive = true;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    return params;
  };

  const updateURL = () => {
    const params: Record<string, string> = {};
    
    if (selectedCourse) params.courseId = selectedCourse;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (inStock) params.inStock = 'true';
    if (!isActive) params.isActive = 'false';
    if (sortBy !== 'name') params.sortBy = sortBy;
    if (sortOrder !== 'asc') params.sortOrder = sortOrder;

    setSearchParams(params);
  };

  const fetchKits = async (isLoadMore = false) => {
    // Validate price range
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      setPriceError('Min price cannot exceed max price');
      return;
    }
    setPriceError('');

    setLoading(true);
    try {
      const params = getFilterParams();
      const response = await apiClient.get<PaginatedResponse>('/kits', { params });
      const { items, totalCount: count, totalPages } = response.data;

      if (isLoadMore) {
        setKits((prev) => [...prev, ...items]);
      } else {
        setKits(items);
      }

      setTotalCount(count);
      setHasMore(currentPage < totalPages);
    } catch (error) {
      console.error('Failed to fetch kits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch kits when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchKits(false);
    updateURL();
  }, [selectedCourse, minPrice, maxPrice, inStock, isActive, sortBy, sortOrder]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchKits(true);
  };

  const handleClearAll = () => {
    setSelectedCourse('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setIsActive(true);
    setSortBy('name');
    setSortOrder('asc');
    setPriceError('');
    setSearchParams({});
  };

  const activeFilterCount = 
    (selectedCourse ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (inStock ? 1 : 0) +
    (!isActive ? 1 : 0);

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (selectedCourse) {
    const course = courses.find((c) => c.courseId.toString() === selectedCourse);
    activeFilters.push({
      label: `Course: ${course?.name || selectedCourse}`,
      onRemove: () => setSelectedCourse(''),
    });
  }
  if (minPrice) {
    activeFilters.push({
      label: `Min: ₹${minPrice}`,
      onRemove: () => setMinPrice(''),
    });
  }
  if (maxPrice) {
    activeFilters.push({
      label: `Max: ₹${maxPrice}`,
      onRemove: () => setMaxPrice(''),
    });
  }
  if (inStock) {
    activeFilters.push({
      label: 'In Stock',
      onRemove: () => setInStock(false),
    });
  }
  if (!isActive) {
    activeFilters.push({
      label: 'Include Inactive',
      onRemove: () => setIsActive(true),
    });
  }

  const handleAddToCart = async (kit: Kit) => {
    try {
      await addToCart({ 
        id: kit.kitId, 
        name: kit.name, 
        price: kit.price, 
        imageUrl: kit.imageUrl 
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };



  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="flex">
        {/* Filter Sidebar */}
        <KitFilterSidebar
          courses={courses}
          selectedCourse={selectedCourse}
          minPrice={minPrice}
          maxPrice={maxPrice}
          inStock={inStock}
          isActive={isActive}
          sortBy={sortBy}
          sortOrder={sortOrder}
          priceError={priceError}
          onCourseChange={setSelectedCourse}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onInStockChange={setInStock}
          onActiveChange={setIsActive}
          onSortChange={(newSortBy, newSortOrder) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
          onClearAll={handleClearAll}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
                  Hardware Kits
                </h1>
                
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-white dark:bg-black text-black dark:text-white text-xs rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{filter.label}</span>
                      <button
                        onClick={filter.onRemove}
                        className="hover:text-purple-900 dark:hover:text-purple-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Results Count */}
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {kits.length} of {totalCount} kits
              </p>
            </div>

            {loading && kits.length === 0 ? (
              <div className="text-center text-neutral-600 dark:text-neutral-400 py-12">
                Loading kits...
              </div>
            ) : kits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  No kits matching your filters.
                </p>
                {activeFilterCount > 0 && (
                  <Button onClick={handleClearAll} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {kits.map((kit) => (
                    <KitCard key={kit.kitId} kit={kit} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      <FloatingCartButton />
    </div>
  );
}
