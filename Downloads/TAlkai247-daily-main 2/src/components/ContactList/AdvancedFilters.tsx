import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from 'lucide-react';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface AdvancedFiltersProps {
  onApplyFilters: (filters: FilterCondition[]) => void;
}

export function AdvancedFilters({ onApplyFilters }: AdvancedFiltersProps) {
  const [showDialog, setShowDialog] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterCondition[]>([
    { field: 'name', operator: 'contains', value: '' }
  ]);

  const fields = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'type', label: 'Type' },
    { value: 'transparencyLevel', label: 'Transparency Level' },
    { value: 'subcategory', label: 'Subcategory' },
    { value: 'tags', label: 'Tags' },
    { value: 'lastContactDate', label: 'Last Contact Date' }
  ];

  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' }
  ];

  const addFilter = () => {
    setFilters([...filters, { field: 'name', operator: 'contains', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof FilterCondition, value: string) => {
    setFilters(filters.map((filter, i) => 
      i === index ? { ...filter, [field]: value } : filter
    ));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="bg-gray-700 hover:bg-gray-600"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Advanced Filters
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Select
                  value={filter.field}
                  onValueChange={(value) => updateFilter(index, 'field', value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(index, 'operator', value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="flex-1"
                  placeholder="Value"
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeFilter(index)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  ×
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addFilter}
              className="w-full bg-gray-700 hover:bg-gray-600"
            >
              Add Filter
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}