import { useState } from "react";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryChips({ selectedCategory, onCategoryChange }: CategoryChipsProps) {
  return (
    <div className="px-2 py-1">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border",
              selectedCategory === category
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            data-testid={`category-chip-${category.toLowerCase()}`}
          >
            <span className="text-xs">{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
            <span className="text-xs font-medium">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
