import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryChips({ selectedCategory, onCategoryChange }: CategoryChipsProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-youtube-dark-secondary">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "category-chip",
              selectedCategory === category && "active"
            )}
            data-testid={`category-chip-${category.toLowerCase()}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
