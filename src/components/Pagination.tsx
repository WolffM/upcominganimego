import { memo, useEffect, useMemo } from 'react';
import { logger } from '@/utils/logger';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onPageSelect: (page: number) => void;
}

export const Pagination = memo(({
  currentPage,
  totalPages,
  hasNextPage,
  onNextPage,
  onPreviousPage,
  onPageSelect,
}: PaginationProps) => {
  useEffect(() => {
    logger.component('Pagination', 'rendered', { 
      currentPage, 
      totalPages, 
      hasNextPage 
    });
  }, [currentPage, totalPages, hasNextPage]);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    logger.debug(`Calculating page numbers for currentPage: ${currentPage}, totalPages: ${totalPages}`, 'Pagination');
    
    const result = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than or equal to maxPagesToShow, show all pages
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      // Always include first page
      result.push(1);
      
      // Calculate start and end of page range
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the start or end
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        result.push('...');
      }
      
      // Add page numbers
      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        result.push('...');
      }
      
      // Always include last page
      if (totalPages > 1) {
        result.push(totalPages);
      }
    }
    
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center mt-8 space-x-2">
      <button
        onClick={() => {
          logger.debug(`Clicked previous page button from page ${currentPage}`, 'Pagination');
          onPreviousPage();
        }}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-md ${
          currentPage === 1
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
            : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
        }`}
      >
        Previous
      </button>
      
      <div className="flex space-x-2">
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-4 py-2">...</span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => {
                if (typeof page === 'number') {
                  logger.debug(`Selected page ${page} from pagination`, 'Pagination');
                  onPageSelect(page);
                }
              }}
              className={`px-4 py-2 rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white dark:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button
        onClick={() => {
          logger.debug(`Clicked next page button from page ${currentPage}`, 'Pagination');
          onNextPage();
        }}
        disabled={!hasNextPage}
        className={`px-4 py-2 rounded-md ${
          !hasNextPage
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
            : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
        }`}
      >
        Next
      </button>
    </div>
  );
}); 