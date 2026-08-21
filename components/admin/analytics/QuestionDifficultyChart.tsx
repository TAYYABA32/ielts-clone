"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HardestQuestion } from "@/lib/admin/analytics";

const BAR_COLOR = "#2a78d6";
const GRID_COLOR = "#e1e0d9";
const MUTED_TEXT = "#898781";
const SECONDARY_TEXT = "#52514e";

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** Horizontal bar chart of the lowest correct-answer-rate questions, plus a full-detail table underneath (the same data, doubling as the chart's accessible table view). */
export function QuestionDifficultyChart({ questions }: { questions: HardestQuestion[] }) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Hardest questions</h2>
        <p className="mt-4 text-sm text-gray-500">
          Not enough answered questions in this range yet (minimum 5 responses per question).
        </p>
      </div>
    );
  }

  const chartData = questions.map((q) => ({
    label: truncate(q.testTitle, 24),
    correctPercent: Math.round(q.correctRate * 100),
    questionId: q.questionId,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Hardest questions</h2>
      <p className="mt-1 text-xs text-gray-500">Lowest correct-answer rate in range, minimum 5 responses.</p>

      <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 32)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="0" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: MUTED_TEXT }} axisLine={false} tickLine={false} unit="%" />
          <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 12, fill: SECONDARY_TEXT }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value: number) => [`${value}%`, "Correct rate"]} />
          <Bar dataKey="correctPercent" name="Correct rate" fill={BAR_COLOR} barSize={20} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Test</th>
              <th>Module</th>
              <th>Correct rate</th>
              <th>Responses</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.questionId}>
                <td>{q.prompt ?? "—"}</td>
                <td>{q.testTitle}</td>
                <td>{q.moduleType}</td>
                <td>{Math.round(q.correctRate * 100)}%</td>
                <td>{q.sampleSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
