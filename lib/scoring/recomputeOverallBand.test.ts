import { describe, expect, it, vi } from "vitest";
import { recomputeOverallBand } from "./recomputeOverallBand";
import { roundToNearestHalfBand } from "./bandScoreTables";

type Tx = Parameters<typeof recomputeOverallBand>[0];

function makeTx(moduleAttempts: Array<{ bandScore: number | null }>) {
  const findMany = vi.fn().mockResolvedValue(moduleAttempts);
  const update = vi.fn().mockResolvedValue(undefined);
  const tx = { moduleAttempt: { findMany }, testAttempt: { update } } as unknown as Tx;
  return { tx, findMany, update };
}

describe("recomputeOverallBand", () => {
  it("returns null when no module attempts exist yet", async () => {
    const { tx } = makeTx([]);
    expect(await recomputeOverallBand(tx, "attempt-1")).toBeNull();
  });

  it("writes an undefined (not null) overallBand when there is nothing to average — Prisma omits undefined fields from the update", async () => {
    const { tx, update } = makeTx([]);
    await recomputeOverallBand(tx, "attempt-1");

    expect(update).toHaveBeenCalledWith({ where: { id: "attempt-1" }, data: { overallBand: undefined } });
  });

  it("returns null when every module attempt exists but none have a bandScore yet (all pending)", async () => {
    const { tx } = makeTx([{ bandScore: null }, { bandScore: null }]);
    expect(await recomputeOverallBand(tx, "attempt-1")).toBeNull();
  });

  it("averages only the module attempts that have a bandScore, ignoring pending ones", async () => {
    const { tx } = makeTx([{ bandScore: 6.0 }, { bandScore: 7.0 }, { bandScore: null }]);
    expect(await recomputeOverallBand(tx, "attempt-1")).toBe(6.5);
  });

  it("rounds a non-half-band mean per IELTS rounding rules", async () => {
    // (6.0 + 6.5 + 6.5) / 3 = 6.333... -> rounds to 6.5
    const { tx } = makeTx([{ bandScore: 6.0 }, { bandScore: 6.5 }, { bandScore: 6.5 }]);
    expect(await recomputeOverallBand(tx, "attempt-1")).toBe(6.5);
  });

  it("computes the overall band once all four modules are graded", async () => {
    const bands = [6.0, 6.5, 7.0, 7.5];
    const { tx } = makeTx(bands.map((bandScore) => ({ bandScore })));
    const expected = roundToNearestHalfBand(bands.reduce((a, b) => a + b, 0) / bands.length);

    expect(await recomputeOverallBand(tx, "attempt-1")).toBe(expected);
  });

  it("persists the computed overall band onto the correct TestAttempt row", async () => {
    const { tx, update } = makeTx([{ bandScore: 8.0 }]);
    await recomputeOverallBand(tx, "attempt-42");

    expect(update).toHaveBeenCalledWith({ where: { id: "attempt-42" }, data: { overallBand: 8.0 } });
  });

  it("scopes the module attempt lookup to the given testAttemptId", async () => {
    const { tx, findMany } = makeTx([{ bandScore: 6.0 }]);
    await recomputeOverallBand(tx, "attempt-7");

    expect(findMany).toHaveBeenCalledWith({ where: { testAttemptId: "attempt-7" } });
  });

  it("handles a single graded module (no averaging needed)", async () => {
    const { tx } = makeTx([{ bandScore: 5.5 }]);
    expect(await recomputeOverallBand(tx, "attempt-1")).toBe(5.5);
  });
});
