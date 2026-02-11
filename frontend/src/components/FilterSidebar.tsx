import { X } from 'lucide-react';
import { Button } from './ui/button';

interface FilterConfig {
  categories: { categoryId: number; name: string }[];
  selectedCategory: string;
  difficulty: string;
  minDuration: string;
  maxDuration: string;
  sortBy: string;
  sortOrder: string;
  isActive: boolean;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onMinDurationChange: (value: string) => void;
  onMaxDurationChange: (value: string) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onActiveChange: (value: boolean) => void;
  onClearAll: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FilterSidebar({
  categories,
  selectedCategory,
  difficulty,
  minDuration,
  maxDuration,
  sortBy,
  sortOrder,
  isActive,
  onCategoryChange,
  onDifficultyChange,
  onMinDurationChange,
  onMaxDurationChange,
  onSortChange,
  onActiveChange,
  onClearAll,
  isOpen = true,
  onClose
}: FilterConfig) {
  
  const handleSortChange = (value: string) => {
    const sortMap: Record<string, { sortBy: string; sortOrder: string }> = {
      'name_asc': { sortBy: 'name', sortOrder: 'asc' },
      'name_desc': { sortBy: 'name', sortOrder: 'desc' },
      'duration_asc': { sortBy: 'duration', sortOrder: 'asc' },
      'duration_desc': { sortBy: 'duration', sortOrder: 'desc' },
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
    if (sortBy === 'duration' && sortOrder === 'asc') return 'duration_asc';
    if (sortBy === 'duration' && sortOrder === 'desc') return 'duration_desc';
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

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Difficulty
        </label>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Duration Range */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Duration (minutes)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minDuration}
            onChange={(e) => onMinDurationChange(e.target.value)}
            className="w-1/2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxDuration}
            onChange={(e) => onMaxDurationChange(e.target.value)}
            className="w-1/2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="0"
          />
        </div>
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
          <option value="duration_asc">Duration (Low to High)</option>
          <option value="duration_desc">Duration (High to Low)</option>
          <option value="newest">Newest First</option>
        </select>
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
            Active courses only
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
