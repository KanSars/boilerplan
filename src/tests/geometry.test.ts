import { describe, expect, it } from "vitest";
import { getEquipmentBodyRect, getEquipmentClearanceRect, rectangleInsideRoom, rectanglesOverlap } from "@/domain/geometry/rectangles";
import { definitions, makeProject } from "@/tests/testFixtures";

describe("geometry", () => {
  it("detects rectangle overlap", () => {
    expect(rectanglesOverlap({ xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 }, { xMm: 50, yMm: 50, widthMm: 100, depthMm: 100 })).toBe(true);
    expect(rectanglesOverlap({ xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 }, { xMm: 100, yMm: 0, widthMm: 100, depthMm: 100 })).toBe(false);
  });

  it("checks room containment", () => {
    const project = makeProject();
    expect(rectangleInsideRoom({ xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 }, project.room)).toBe(true);
    expect(rectangleInsideRoom({ xMm: -1, yMm: 0, widthMm: 100, depthMm: 100 }, project.room)).toBe(false);
  });

  it("calculates body and clearance rectangles", () => {
    const project = makeProject();
    const instance = project.equipmentInstances[0];
    const definition = definitions.find((item) => item.id === instance.definitionId);
    expect(definition).toBeDefined();
    if (!definition) return;
    expect(getEquipmentBodyRect(instance, definition)).toEqual({ xMm: 500, yMm: 500, widthMm: 900, depthMm: 1200 });
    expect(getEquipmentClearanceRect(instance, definition)).toEqual({ xMm: 0, yMm: -100, widthMm: 1900, depthMm: 2800 });
  });
});
