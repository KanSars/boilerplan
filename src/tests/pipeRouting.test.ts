import { describe, expect, it } from "vitest";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { definitions, makeProject } from "@/tests/testFixtures";

const context = { equipmentDefinitions: definitions };

describe("pipe routing from logical connections", () => {
  it("creates routes from connected system connections", () => {
    const project = makeProject();
    project.equipmentInstances = [
      project.equipmentInstances[0],
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 2500, yMm: 500 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 2500, yMm: 1000 }, rotationDeg: 0, label: "Коллектор обратки" },
    ];

    const routes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);
    expect(routes).toHaveLength(2);
    expect(routes[0].polylinePoints[0]).toEqual({ xMm: 1280, yMm: 650 });
    expect(routes[0].polylinePoints.at(-1)).toEqual({ xMm: 3500, yMm: 625 });
  });

  it("does not create routes when target connections are missing", () => {
    const project = makeProject();
    project.equipmentInstances = [project.equipmentInstances[0]];
    const routes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);
    expect(routes).toHaveLength(0);
  });
});
