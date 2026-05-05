import { describe, expect, it } from "vitest";
import { PilotKitCalculationService } from "@/infrastructure/calculation/PilotKitCalculationService";
import { definitions } from "@/tests/testFixtures";

describe("pilot engineering calculations", () => {
  it("calculates hydronic flow and velocity for the RGT-100 pilot kit", () => {
    const results = new PilotKitCalculationService().calculate(definitions);
    const hydronic = results.find((result) => result.id === "calc-hydronic-flow");

    expect(hydronic?.status).toBe("calculated_review_required");
    expect(hydronic?.formula).toBe("m = P / (c * Δt); V = m / ρ; v = V / A");
    expect(hydronic?.inputs.powerKw).toBe(99);
    expect(hydronic?.inputs.deltaT).toBe(20);
    expect(hydronic?.outputs.volumeFlowM3H).toBeCloseTo(4.26, 2);
    expect(hydronic?.outputs.velocityMS).toBeCloseTo(1.17, 2);
    expect(hydronic?.sourceDocumentIds).toContain("src-sp-89-13330-2016");
  });

  it("calculates preliminary gas velocity when passport gas flow is available", () => {
    const results = new PilotKitCalculationService().calculate(definitions);
    const gas = results.find((result) => result.id === "calc-gas-velocity");

    expect(gas?.status).toBe("calculated_review_required");
    expect(gas?.inputs.gasFlowM3H).toBe(12);
    expect(gas?.outputs.velocityMS).toBeCloseTo(5.78, 2);
    expect(gas?.limitations.join(" ")).toContain("без расчета падения давления");
  });
});
