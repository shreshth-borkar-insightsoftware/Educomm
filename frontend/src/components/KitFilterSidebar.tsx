import { X } from 'lucide-react';
import { Button } from './ui/button';

interface KitFilterConfig {
  courses: { courseId: number; name: string }[];
  selectedCourse: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  isActive: boolean;
  sortBy: string;
  sortOrder: string;
  priceError: string;
  onCourseChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onInStockChange: (value: boolean) => void;
  onActiveChange: (value: boolean) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onClearAll: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function KitFilterSidebar({
  courses,
  selectedCourse,
  minPrice,
  maxPrice,
  inStock,
  isActive,
  sortBy,
  sortOrder,
  priceError,
  onCourseChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockChange,
  onActiveChange,
  onSortChange,
  onClearAll,
  isOpen = true,
  onClose
}: KitFilterConfig) {
  
  const handleSortChange = (value: string) => {
    const sortMap: Record<string, { sortBy: string; sortOrder: string }> = {
      'name_asc': { sortBy: 'name', sortOrder: 'asc' },
      'name_desc': { sortBy: 'name', sortOrder: 'desc' },
      'price_low': { sortBy: 'price_low', sortOrder: 'asc' },
      'price_high': { sortBy: 'price_high', sortOrder: 'desc' },
      'newest': { sortBy: 'newest', sortOrder: 'desc' }
    };
    const sort = sortMap[value];
    if (sort) {
      onSortChange(sort.sortBy, sort.sortOrder);
    }
  };

  const getCurrentSortValue = () => {
    if (sortBy === 'name' && sortOrder === 'asc') return 'name_asc';
    if (sortBy === 'name' && sortOrder === 'desc') return 'name_desc';
    if (sortBy === 'price_low') return 'price_low';
    if (sortBy === 'price_high') return 'price_high';
    if (sortBy === 'newest') return 'newest';
    return 'name_asc';
  };

  const filterContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Filters</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Clear All
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Course Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Course
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => onCourseChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.courseId} value={course.courseId}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Price Range (₹)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min (₹)"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="w-1/2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="0"
          />
          <input
            type="number"
            placeholder="Max (₹)"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="w-1/2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="0"
          />
        </div>
        {priceError && (
          <p className="text-red-500 text-xs mt-1">{priceError}</p>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Sort By
        </label>
        <select
          value={getCurrentSortValue()}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="price_low">Price (Low to High)</option>
          <option value="price_high">Price (High to Low)</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* In Stock Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            In stock only
          </span>
        </label>
      </div>

      {/* Active Only Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onActiveChange(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Active kits only
          </span>
        </label>
      </div>
    </>
  );

  // Mobile overlay
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div className="lg:hidden">
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        <div className="fixed top-0 left-0 bottom-0 w-80 max-w-full bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 z-50 overflow-y-auto p-6">
          {filterContent}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 p-6 sticky top-0 h-screen overflow-y-auto">
        {filterContent}
      </div>
    </>
  );
}
