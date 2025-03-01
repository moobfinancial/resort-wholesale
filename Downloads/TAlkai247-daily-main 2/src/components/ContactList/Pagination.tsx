import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onItemsPerPageChange: (value: string) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onItemsPerPageChange
}: PaginationProps) {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pageNumbers.slice(
    Math.max(0, currentPage - 2),
    Math.min(totalPages, currentPage + 1)
  );

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} contacts
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gray-700 hover:bg-gray-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {currentPage > 3 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              className="bg-gray-700 hover:bg-gray-600"
            >
              1
            </Button>
            {currentPage > 4 && <span className="text-gray-400">...</span>}
          </>
        )}

        {visiblePages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={currentPage === page ? 
              "bg-teal-600 hover:bg-teal-700" : 
              "bg-gray-700 hover:bg-gray-600"
            }
          >
            {page}
          </Button>
        ))}

        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-700 hover:bg-gray-600"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Select
          value={itemsPerPage.toString()}
          onValueChange={onItemsPerPageChange}
        >
          <SelectTrigger className="w-[100px] bg-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}