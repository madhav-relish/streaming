"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ContentPaginationProps {
  totalPages: number;
  currentPage: number;
}

export function ContentPagination({
  totalPages,
  currentPage,
}: ContentPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a new URLSearchParams object to modify
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const generatePagination = () => {
    // If there are 7 or fewer pages, show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always include first and last page
    const firstPage = 1;
    const lastPage = totalPages;

    // Calculate pages around current page
    const leftSiblingIndex = Math.max(currentPage - 1, firstPage);
    const rightSiblingIndex = Math.min(currentPage + 1, lastPage);

    // Don't show dots if only one page would be hidden
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < lastPage - 1;

    // Default case: show first, last, and pages around current
    if (shouldShowLeftDots && shouldShowRightDots) {
      return [1, "...", leftSiblingIndex, currentPage, rightSiblingIndex, "...", totalPages];
    }

    // Show more pages on the left
    if (!shouldShowLeftDots && shouldShowRightDots) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    // Show more pages on the right
    if (shouldShowLeftDots && !shouldShowRightDots) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    // Fallback (shouldn't happen)
    return [1, 2, 3, "...", totalPages - 2, totalPages - 1, totalPages];
  };

  const pages = generatePagination();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href={createPageURL(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {pages.map((page, i) => (
          page === "..." ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={`page-${page}`}>
              <PaginationLink 
                href={createPageURL(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        ))}
        
        <PaginationItem>
          <PaginationNext 
            href={createPageURL(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
