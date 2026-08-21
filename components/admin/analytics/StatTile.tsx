interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
}

/** Headline-number tile — see the dataviz skill's stat-tile contract (label · value · optional sublabel). */
export function StatTile({ label, value, sublabel }: StatTileProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}
