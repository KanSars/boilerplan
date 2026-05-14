import { describe, expect, it } from "vitest";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import { definitions, makeProject } from "@/tests/testFixtures";

const engine = new ValidationEngine(DemoInternalStandardsProfile);

describe("validation", () => {
  it("creates an error when equipment is outside the room", () => {
    const project = makeProject();
    project.equipmentInstances[0].position = { xMm: -20, yMm: 0 };
    const issues = engine.validate(project, { equipmentDefinitions: definitions });
    expect(issues.some((issue) => issue.ruleId === "equipment_inside_room" && issue.severity === "error")).toBe(true);
  });

  it("creates an error for overlapping equipment bodies", () => {
    const project = makeProject();
    project.equipmentInstances[1].position = { xMm: 700, yMm: 600 };
    const issues = engine.validate(project, { equipmentDefinitions: definitions });
    expect(issues.some((issue) => issue.ruleId === "equipment_body_collision" && issue.severity === "error")).toBe(true);
  });

  it("creates a warning for overlapping service clearances", () => {
    const project = makeProject();
    project.equipmentInstances[1].position = { xMm: 1800, yMm: 500 };
    const issues = engine.validate(project, { equipmentDefinitions: definitions });
    expect(issues.some((issue) => issue.ruleId === "service_clearance_collision_demo" && issue.severity === "warning")).toBe(true);
  });

  it("creates an error for boiler definitions without required connections", () => {
    const project = makeProject();
    const brokenDefinition: EquipmentDefinition = {
      ...definitions[0],
      id: "broken-boiler",
      connectionPoints: definitions[0].connectionPoints.filter((point) => point.type !== "return"),
    };
    project.equipmentInstances = [{ ...project.equipmentInstances[0], definitionId: "broken-boiler" }];
    const issues = engine.validate(project, { equipmentDefinitions: [brokenDefinition] });
    expect(issues.some((issue) => issue.ruleId === "required_connection_points" && issue.severity === "error")).toBe(true);
  });

  it("creates an error when the minimal pilot kit is incomplete", () => {
    const project = makeProject();
    project.equipmentInstances = [
      { id: "inst_boiler_1", definitionId: "rgt-100-ksva-100", position: { xMm: 1550, yMm: 2850 }, rotationDeg: 0, label: "К1" },
      { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
    ];

    const issues = engine.validate(project, { equipmentDefinitions: definitions });
    expect(issues.some((issue) => issue.ruleId === "required_pilot_kit_elements" && issue.severity === "error")).toBe(true);
  });
});
