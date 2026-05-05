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
    expect(routes[0].polylinePoints.at(-1)).toEqual({ xMm: 2500, yMm: 580 });
    expect(routes[0].nominalDiameterMm).toBe(80);
    expect(routes[0].metadata).toMatchObject({
      sourceDocumentId: "src-gost-3262-75",
      reviewStatus: "review_required",
    });
  });

  it("does not create routes when target connections are missing", () => {
    const project = makeProject();
    project.equipmentInstances = [project.equipmentInstances[0]];
    const routes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);
    expect(routes).toHaveLength(0);
  });

  it("routes through placed valve equipment when a matching valve exists", () => {
    const project = makeProject();
    project.equipmentInstances = [
      project.equipmentInstances[0],
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 2500, yMm: 500 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 2500, yMm: 1000 }, rotationDeg: 0, label: "Коллектор обратки" },
      { id: "valve-supply", definitionId: "ball-valve-dn32-supply", position: { xMm: 1600, yMm: 700 }, rotationDeg: 0, label: "Кран T1" },
    ];

    const routes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);
    const supplyRoute = routes.find((route) => route.systemType === "supply");

    expect(supplyRoute?.metadata).toMatchObject({ valveEquipmentInstanceId: "valve-supply" });
    expect(supplyRoute?.polylinePoints).toEqual(expect.arrayContaining([
      { xMm: 1600, yMm: 750 },
      { xMm: 1780, yMm: 750 },
    ]));
  });
});
