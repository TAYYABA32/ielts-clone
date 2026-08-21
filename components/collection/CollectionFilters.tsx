import { CollectionSearchBar } from "@/components/collection/CollectionSearchBar";

export type SortOption = "newest" | "oldest" | "popular";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most Popular" },
];

interface CollectionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

/**
 * Search (left) + sort (right) row — reference's .search-box uses a 1rem
 * gap between the two controls; the sort <select> is styled to match the
 * search input's height/radius/border so they read as one control group.
 */
export function CollectionFilters({ search, onSearchChange, sortBy, onSortChange }: CollectionFiltersProps) {
  return (
    <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <CollectionSearchBar value={search} onChange={onSearchChange} />
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        aria-label="Sort by"
        className="mt-0 h-10 w-auto rounded-full border border-[#BDC5CF] px-4 text-sm text-[#294563] shadow-none focus:border-[#294563] focus:outline-none focus:ring-2 focus:ring-[#294563]/30"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
