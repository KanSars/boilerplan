import { describe, expect, it } from "vitest";
import { removeEquipmentInstance } from "@/domain/project/removeEquipmentInstance";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { definitions, makeProject } from "@/tests/testFixtures";

describe("project updates", () => {
  it("deletes equipment instances and connected piping routes", () => {
    const project = makeProject();
    project.equipmentInstances.push(
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 500, yMm: 3000 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 500, yMm: 3500 }, rotationDeg: 0, label: "Коллектор обратки" },
    );
    const routedProject = {
      ...project,
      pipingRoutes: new SimpleOrthogonalPipeRouter().generateRoutes(project, { equipmentDefinitions: definitions }),
    };

    expect(routedProject.pipingRoutes.some((route) => route.from.equipmentInstanceId === "b1")).toBe(true);

    const updatedProject = removeEquipmentInstance(routedProject, "b1");
    expect(updatedProject.equipmentInstances.some((instance) => instance.id === "b1")).toBe(false);
    expect(updatedProject.pipingRoutes.some((route) => route.from.equipmentInstanceId === "b1" || route.to.equipmentInstanceId === "b1")).toBe(false);
  });

  it("allows validation to update after deletion", () => {
    const project = makeProject();
    project.equipmentInstances[1].position = { xMm: 700, yMm: 600 };
    const engine = new ValidationEngine(DemoInternalStandardsProfile);
    const before = engine.validate(project, { equipmentDefinitions: definitions });
    const after = engine.validate(removeEquipmentInstance(project, "b2"), { equipmentDefinitions: definitions });

    expect(before.some((issue) => issue.ruleId === "equipment_body_collision")).toBe(true);
    expect(after.some((issue) => issue.ruleId === "equipment_body_collision")).toBe(false);
  });
});
