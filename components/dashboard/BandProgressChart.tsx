"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BandHistoryPoint } from "@/app/api/users/[userId]/band-history/route";

interface ChartDatum {
  date: string;
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
}

const SERIES: Array<{ key: keyof Omit<ChartDatum, "date">; label: string; color: string }> = [
  { key: "overall", label: "Overall Band", color: "#2563eb" },
  { key: "listening", label: "Listening", color: "#059669" },
  { key: "reading", label: "Reading", color: "#d97706" },
  { key: "writing", label: "Writing", color: "#dc2626" },
  { key: "speaking", label: "Speaking", color: "#7c3aed" },
];

function toChartData(history: BandHistoryPoint[]): ChartDatum[] {
  return history.map((point) => ({
    date: new Date(point.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    overall: point.overallBand,
    listening: point.moduleBands.LISTENING ?? null,
    reading: point.moduleBands.READING ?? null,
    writing: point.moduleBands.WRITING ?? null,
    speaking: point.moduleBands.SPEAKING ?? null,
  }));
}

interface BandProgressChartProps {
  userId: string;
}

export function BandProgressChart({ userId }: BandProgressChartProps) {
  const [data, setData] = useState<ChartDatum[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${userId}/band-history`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load band history (${res.status})`);
        return res.json();
      })
      .then((body: { history: BandHistoryPoint[] }) => {
        if (!cancelled) setData(toChartData(body.history));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load band history");
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) return <p className="ielts-chart__error">{error}</p>;
  if (!data) return <p className="ielts-chart__loading">Loading band history…</p>;
  if (data.length === 0) return <p className="ielts-chart__empty">No submitted attempts yet — complete a test to start tracking progress.</p>;

  return (
    <div className="ielts-band-progress-chart" data-testid="band-progress-chart">
      <h2>Band Score Progression</h2>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} />
          <Tooltip />
          <Legend />
          {SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={series.key === "overall" ? 3 : 1.5}
              connectNulls
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
