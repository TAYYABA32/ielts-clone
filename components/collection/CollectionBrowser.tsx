"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TEST_VOLUMES, type TestVolume, type VolumeMonthEntry } from "@/lib/data/testVolumes";
import { CategoryTabs, type CategoryFilter } from "@/components/collection/CategoryTabs";
import { SkillTabs, type SkillFilter } from "@/components/collection/SkillTabs";
import { CollectionFilters, type SortOption } from "@/components/collection/CollectionFilters";
import { CollectionVolumeCard } from "@/components/collection/CollectionVolumeCard";

const VALID_SKILLS: SkillFilter[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];

// Every month entry offers practice in all four skills (see
// VolumeMonthEntry.attemptsBySkill) — there's no single "skill" field per
// entry to match against, so skill-name search terms are treated as always
// present rather than tied to one specific card.
const SKILL_SEARCH_TERMS = "listening reading writing speaking";

function skillFromQueryParam(value: string | null): SkillFilter {
  const upper = value?.toUpperCase();
  return VALID_SKILLS.includes(upper as SkillFilter) ? (upper as SkillFilter) : "ALL";
}

// Attempts are never actually 0 in this dataset (see SKILL_SHARE in
// testVolumes.ts), so this never excludes anything today — it's here so an
// entry genuinely missing a skill (real data, in the future) is correctly
// dropped instead of silently kept.
function entryHasSkill(entry: VolumeMonthEntry, skillFilter: SkillFilter): boolean {
  return skillFilter === "ALL" || entry.attemptsBySkill[skillFilter] > 0;
}

function VolumeSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md sm:p-8 lg:grid-cols-[auto_1fr]">
      <div className="mx-auto aspect-[3/4] w-36 rounded-md bg-gray-200 sm:w-44" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

/**
 * Exam Library browser. The page scrolls by YEAR (a handful of large
 * Volume cards), never by hundreds of individual test cards — there's no
 * pagination here on purpose, since the whole point of grouping by year is
 * that the resulting list is short enough to scroll through directly.
 */
export function CollectionBrowser() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  // Reads the Exam Library dropdown's "?skill=reading"-style links (see
  // navigationConfig.ts) so those links land pre-filtered rather than
  // just dropping the visitor on the unfiltered page.
  const [skill, setSkill] = useState<SkillFilter>(() => skillFromQueryParam(searchParams.get("skill")));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(false);

  const filteredVolumes = useMemo(() => {
    const query = search.trim().toLowerCase();

    const withFilteredMonths: TestVolume[] = TEST_VOLUMES.map((volume) => ({
      ...volume,
      months: volume.months.filter((entry) => {
        const matchesCategory = category === "ALL" || entry.testType === category;
        const matchesSkill = entryHasSkill(entry, skill);
        const categoryLabel = entry.testType === "ACADEMIC" ? "academic" : "general training";
        const haystack = `${entry.month} ${entry.year} ${categoryLabel} ${SKILL_SEARCH_TERMS}`.toLowerCase();
        const matchesQuery = query === "" || haystack.includes(query);
        return matchesCategory && matchesSkill && matchesQuery;
      }),
    })).filter((volume) => volume.months.length > 0);

    const sorted = [...withFilteredMonths];
    if (sortBy === "oldest") sorted.reverse();
    else if (sortBy === "popular") {
      sorted.sort((a, b) => {
        const totalB = b.months.reduce((sum, m) => sum + m.totalAttempts, 0);
        const totalA = a.months.reduce((sum, m) => sum + m.totalAttempts, 0);
        return totalB - totalA;
      });
    }
    // "newest" keeps TEST_VOLUMES' own newest-first order

    return sorted;
  }, [category, skill, search, sortBy]);

  // No real network fetch — this just gives filter/sort changes a brief,
  // honest loading state instead of an instant re-render that could look
  // like nothing happened.
  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timeout);
  }, [category, skill, search, sortBy]);

  return (
    <div>
      <CategoryTabs value={category} onChange={setCategory} />
      <SkillTabs value={skill} onChange={setSkill} />
      <CollectionFilters search={search} onSearchChange={setSearch} sortBy={sortBy} onSortChange={setSortBy} />

      {isLoading ? (
        <div className="space-y-8" aria-busy="true" aria-live="polite">
          <VolumeSkeleton />
          <VolumeSkeleton />
        </div>
      ) : filteredVolumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-base font-bold text-[#1b2a4a]">No tests match your search</p>
          <p className="mt-2 text-sm text-gray-500">Try a different keyword, category, or clear the filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredVolumes.map((volume) => (
            <CollectionVolumeCard key={volume.year} volume={volume} activeSkill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
