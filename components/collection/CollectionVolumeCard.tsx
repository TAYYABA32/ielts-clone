import type { Skill, TestVolume } from "@/lib/data/testVolumes";
import { BookCover } from "@/components/collection/BookCover";
import { MonthCard } from "@/components/collection/MonthCard";

interface CollectionVolumeCardProps {
  volume: TestVolume;
  activeSkill: Skill | "ALL";
}

/**
 * One large white year-Volume container: fixed-width book cover on the
 * left, a responsive month grid on the right. Below `lg`, the book sits
 * above the grid instead of beside it (mobile/tablet per spec); the month
 * grid itself is 1-column on mobile, 2-column from `sm` up.
 */
export function CollectionVolumeCard({ volume, activeSkill }: CollectionVolumeCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md sm:p-8 lg:grid-cols-[auto_1fr]">
      <div className="shrink-0 lg:w-44">
        <BookCover year={volume.year} variant={volume.variant} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {volume.months.map((entry) => (
          <MonthCard key={entry.id} entry={entry} activeSkill={activeSkill} />
        ))}
      </div>
    </div>
  );
}
