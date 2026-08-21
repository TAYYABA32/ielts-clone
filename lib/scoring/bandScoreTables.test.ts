import { describe, expect, it } from "vitest";
import { getBandTable, rawToBand, roundToNearestHalfBand } from "./bandScoreTables";

describe("getBandTable", () => {
  it("returns the Listening table regardless of test type", () => {
    expect(getBandTable("ACADEMIC", "LISTENING")).toBe(getBandTable("GENERAL", "LISTENING"));
  });

  it("returns different tables for Academic vs General Reading", () => {
    expect(getBandTable("ACADEMIC", "READING")).not.toBe(getBandTable("GENERAL", "READING"));
  });

  it("throws for Writing/Speaking — those are always examiner-scored, never table-based", () => {
    expect(() => getBandTable("ACADEMIC", "WRITING")).toThrow(/No static band table/);
    expect(() => getBandTable("ACADEMIC", "SPEAKING")).toThrow(/No static band table/);
  });
});

describe("rawToBand", () => {
  it("maps a perfect score to band 9.0 for every table", () => {
    expect(rawToBand(40, "ACADEMIC", "LISTENING")).toBe(9.0);
    expect(rawToBand(40, "ACADEMIC", "READING")).toBe(9.0);
    expect(rawToBand(40, "GENERAL", "READING")).toBe(9.0);
  });

  it("maps a zero score to the lowest band in each table", () => {
    expect(rawToBand(0, "ACADEMIC", "LISTENING")).toBe(2.0);
    expect(rawToBand(0, "ACADEMIC", "READING")).toBe(2.0);
    expect(rawToBand(0, "GENERAL", "READING")).toBe(2.5);
  });

  it("gives different bands for the same raw score depending on Academic vs General Reading", () => {
    // Raw 30 is band 7.0 on the (harder) Academic table but only 6.0 on General.
    expect(rawToBand(30, "ACADEMIC", "READING")).toBe(7.0);
    expect(rawToBand(30, "GENERAL", "READING")).toBe(6.0);
  });

  it("covers every integer raw score 0-40 for every table with no gaps", () => {
    for (const [testType, moduleType] of [
      ["ACADEMIC", "LISTENING"],
      ["ACADEMIC", "READING"],
      ["GENERAL", "READING"],
    ] as const) {
      for (let raw = 0; raw <= 40; raw++) {
        expect(() => rawToBand(raw, testType, moduleType), `raw=${raw} ${testType}/${moduleType}`).not.toThrow();
      }
    }
  });

  it("rounds a fractional raw score to the nearest integer before lookup", () => {
    // 34.6 rounds to 35, which is band 8.0 on the Academic Reading table.
    expect(rawToBand(34.6, "ACADEMIC", "READING")).toBe(8.0);
  });

  it("clamps negative raw scores to 0 rather than throwing", () => {
    expect(rawToBand(-5, "ACADEMIC", "LISTENING")).toBe(rawToBand(0, "ACADEMIC", "LISTENING"));
  });

  it("throws for a raw score above the table's maximum", () => {
    expect(() => rawToBand(41, "ACADEMIC", "LISTENING")).toThrow(/out of range/);
  });
});

describe("roundToNearestHalfBand", () => {
  it("leaves an exact multiple of 0.5 unchanged", () => {
    expect(roundToNearestHalfBand(6.0)).toBe(6.0);
    expect(roundToNearestHalfBand(6.5)).toBe(6.5);
    expect(roundToNearestHalfBand(0)).toBe(0);
  });

  it("rounds a .25 fraction up to the next half band (IELTS rule)", () => {
    expect(roundToNearestHalfBand(6.25)).toBe(6.5);
  });

  it("rounds a .75 fraction up to the next whole band (IELTS rule)", () => {
    expect(roundToNearestHalfBand(6.75)).toBe(7.0);
  });

  it("rounds down for fractions below the .25 midpoint", () => {
    expect(roundToNearestHalfBand(6.1)).toBe(6.0);
  });

  it("rounds up for fractions above the .25 midpoint but below .75", () => {
    expect(roundToNearestHalfBand(6.4)).toBe(6.5);
  });

  it("handles the repeating-decimal case from averaging 3 module bands", () => {
    // (6.0 + 6.5 + 6.5) / 3 = 6.3333...
    expect(roundToNearestHalfBand((6.0 + 6.5 + 6.5) / 3)).toBe(6.5);
  });
});
