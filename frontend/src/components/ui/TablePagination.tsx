import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: TablePaginationProps) {
  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          className={`min-w-[2.5rem] ${
            currentPage === page
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800"
          }`}
        >
          {page}
        </Button>
      ));
    }

    // Show first, current ± 1, last with ellipsis
    const pages: (number | string)[] = [];
    
    if (currentPage > 2) {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
    }
    
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((page, idx) =>
      typeof page === "number" ? (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          className={`min-w-[2.5rem] ${
            currentPage === page
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800"
          }`}
        >
          {page}
        </Button>
      ) : (
        <span key={`ellipsis-${idx}`} className="px-2 text-neutral-500">
          {page}
        </span>
      )
    );
  };

  return (
    <div className="flex items-center justify-between py-4 px-2 border-t border-neutral-800">
      <div className="text-sm text-neutral-400">
        Showing page <span className="font-bold text-white">{currentPage}</span> of{" "}
        <span className="font-bold text-white">{totalPages}</span>{" "}
        (<span className="font-bold text-white">{totalCount}</span> total records)
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">{renderPageNumbers()}</div>

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
