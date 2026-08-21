"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Chart chrome + sequential-blue values from the dataviz skill's reference
// palette (references/palette.md) — single series, so no legend is needed
// (the chart title already names what's plotted).
const LINE_COLOR = "#2a78d6";
const GRID_COLOR = "#e1e0d9";
const AXIS_COLOR = "#c3c2b7";
const MUTED_TEXT = "#898781";
const SURFACE = "#fcfcfb";

export interface TrendPoint {
  date: string;
  value: number;
}

interface TrendLineChartProps {
  title: string;
  caption?: string;
  data: TrendPoint[];
  valueLabel: string;
  formatValue?: (value: number) => string;
}

/** Generic single-series trend chart (registrations/day, pass-rate/day, etc.) with a native <details> table-view fallback for accessibility. */
export function TrendLineChart({ title, caption, data, valueLabel, formatValue = (v) => String(v) }: TrendLineChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {caption && <p className="mt-1 text-xs text-gray-500">{caption}</p>}

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No data in this date range.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: MUTED_TEXT }} axisLine={{ stroke: AXIS_COLOR }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: MUTED_TEXT }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(value: number) => [formatValue(value), valueLabel]} />
              <Line
                type="monotone"
                dataKey="value"
                name={valueLabel}
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 4, fill: LINE_COLOR, stroke: SURFACE, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">View as table</summary>
            <table className="mt-2">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{valueLabel}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((point) => (
                  <tr key={point.date}>
                    <td>{point.date}</td>
                    <td>{formatValue(point.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}
