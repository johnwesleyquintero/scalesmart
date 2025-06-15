import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';

const CategorySelector = () => {
  const { category, setCategory, allCategories } = useMarkdownNotepadContext();

  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={setCategory} value={category}>
        <SelectTrigger className="w-[180px]" aria-label="Select category">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="All Categories">
            All Categories
          </SelectItem>
          {allCategories
            .filter((cat) => cat.name !== '')
            .map((cat) => (
              <SelectItem key={cat.id} value={cat.name} label={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          <SelectItem value="uncategorized" label="Uncategorized">
            Uncategorized
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
