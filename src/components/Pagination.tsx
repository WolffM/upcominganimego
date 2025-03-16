import { memo, useMemo, useEffect } from 'react';
import { PAGINATION_STYLES } from '@/utils/uiStyles';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSelect: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const PaginationComponent = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageSelect,
  hasNextPage,
  hasPreviousPage
}: PaginationProps) => {
  // Log when pagination props change
  useEffect(() => {
    console.log('🔢 Pagination component received props:', {
      currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage
    });
  }, [currentPage, totalPages, hasNextPage, hasPreviousPage]);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    console.log('🔢 Generating page numbers with totalPages:', totalPages, 'currentPage:', currentPage);
    
    const maxPagesToShow = 5; // Show at most 5 page numbers
    const numbers: (number | string)[] = [];
    
    // Simple case: if we have 5 or fewer pages, show all of them
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(i);
      }
      return numbers;
    }
    
    // Complex case: we need to show a subset of pages with ellipses
    
    // Always show first page
    numbers.push(1);
    
    // Determine the range of middle pages to show
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust range if we're near the beginning or end
    if (currentPage <= 3) {
      endPage = Math.min(4, totalPages - 1);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3);
    }
    
    // Add ellipsis if there's a gap after page 1
    if (startPage > 2) {
      numbers.push('...');
    }
    
    // Add the middle pages
    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }
    
    // Add ellipsis if there's a gap before the last page
    if (endPage < totalPages - 1) {
      numbers.push('...');
    }
    
    // Always show last page
    numbers.push(totalPages);
    
    return numbers;
  }, [currentPage, totalPages]);

  // If there's only one page, don't show pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={PAGINATION_STYLES.CONTAINER}>
      <button
        onClick={onPreviousPage}
        disabled={!hasPreviousPage}
        className={!hasPreviousPage
          ? PAGINATION_STYLES.DISABLED_BUTTON
          : PAGINATION_STYLES.ACTIVE_BUTTON
        }
        aria-label="Go to previous page"
      >
        Previous
      </button>
      
      <div className={PAGINATION_STYLES.BUTTONS_CONTAINER}>
        {pageNumbers.map((pageNum, index) => {
          // Render ellipsis
          if (pageNum === '...') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className={PAGINATION_STYLES.ELLIPSIS}
                aria-hidden="true"
              >
                ...
              </span>
            );
          }
          
          // Render page button
          const page = pageNum as number;
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageSelect(page)}
              className={`${PAGINATION_STYLES.PAGE_BUTTON} ${
                currentPage === page
                  ? PAGINATION_STYLES.ACTIVE_BUTTON
                  : PAGINATION_STYLES.INACTIVE_BUTTON
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className={!hasNextPage
          ? PAGINATION_STYLES.DISABLED_BUTTON
          : PAGINATION_STYLES.ACTIVE_BUTTON
        }
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  );
};

export const Pagination = memo(PaginationComponent); 