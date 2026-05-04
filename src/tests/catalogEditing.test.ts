import { describe, expect, it } from "vitest";
import type { ConnectionPoint } from "@/domain/equipment/ConnectionPoint";
import { getEquipmentBodyRect } from "@/domain/geometry/rectangles";
import { getAllWorldConnectionPoints } from "@/domain/geometry/transforms";
import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import { CsvEquipmentScheduleExporter } from "@/infrastructure/exporters/CsvEquipmentScheduleExporter";
import { definitions, makeProject } from "@/tests/testFixtures";

const cloneDefinitions = () => definitions.map((definition) => ({
  ...definition,
  dimensionsMm: { ...definition.dimensionsMm },
  serviceClearancesMm: { ...definition.serviceClearancesMm },
  connectionPoints: definition.connectionPoints.map((point) => ({
    ...point,
    position: { ...point.position },
  })),
}));

describe("catalog editing effects", () => {
  it("placed equipment body rect uses updated definition dimensions", () => {
    const project = makeProject();
    const editedDefinitions = cloneDefinitions();
    const boiler = editedDefinitions.find((definition) => definition.id === "boiler-250kw");
    expect(boiler).toBeDefined();
    if (!boiler) return;
    boiler.dimensionsMm.width = 1300;
    boiler.dimensionsMm.depth = 1700;

    const rect = getEquipmentBodyRect(project.equipmentInstances[0], boiler);
    expect(rect.widthMm).toBe(1300);
    expect(rect.depthMm).toBe(1700);
  });

  it("added connection point appears in world connection points", () => {
    const project = makeProject();
    const editedDefinitions = cloneDefinitions();
    const boiler = editedDefinitions.find((definition) => definition.id === "boiler-250kw");
    if (!boiler) return;
    const point: ConnectionPoint = {
      id: "manual-extra",
      type: "drain",
      label: "Дренаж",
      position: { xMm: 450, yMm: 1180 },
      source: "manual_catalog",
      confidence: 1,
    };
    boiler.connectionPoints.push(point);

    const worldPoints = getAllWorldConnectionPoints(project, editedDefinitions);
    expect(worldPoints.some((worldPoint) => worldPoint.connectionPointId === "manual-extra")).toBe(true);
  });

  it("resolver uses updated connection point target data", () => {
    const project = makeProject();
    project.equipmentInstances = [
      project.equipmentInstances[0],
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 2500, yMm: 500 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 2500, yMm: 1000 }, rotationDeg: 0, label: "Коллектор обратки" },
    ];
    const editedDefinitions = cloneDefinitions();
    const supplyHeader = editedDefinitions.find((definition) => definition.id === "supply-header");
    if (!supplyHeader) return;
    supplyHeader.connectionPoints[0] = {
      ...supplyHeader.connectionPoints[0],
      id: "edited-supply-main",
      position: { xMm: 1200, yMm: 100 },
    };

    const connection = new SystemConnectionResolver().resolve(project, { equipmentDefinitions: editedDefinitions })
      .find((item) => item.systemType === "supply");
    expect(connection?.to?.connectionPointId).toBe("edited-supply-main");
  });

  it("deleting connection point removes resolver connection target", () => {
    const project = makeProject();
    project.equipmentInstances = [
      project.equipmentInstances[0],
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 2500, yMm: 500 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 2500, yMm: 1000 }, rotationDeg: 0, label: "Коллектор обратки" },
    ];
    const editedDefinitions = cloneDefinitions();
    const supplyHeader = editedDefinitions.find((definition) => definition.id === "supply-header");
    if (!supplyHeader) return;
    supplyHeader.connectionPoints = [];

    const connection = new SystemConnectionResolver().resolve(project, { equipmentDefinitions: editedDefinitions })
      .find((item) => item.systemType === "supply");
    expect(connection?.status).toBe("missing_target");
  });

  it("CSV exporter uses edited definition name and dimensions", () => {
    const project = makeProject();
    const editedDefinitions = cloneDefinitions();
    const boiler = editedDefinitions.find((definition) => definition.id === "boiler-250kw");
    if (!boiler) return;
    boiler.name = "Котёл редактора";
    boiler.dimensionsMm.width = 1111;

    const csv = new CsvEquipmentScheduleExporter().export(project, { equipmentDefinitions: editedDefinitions });
    expect(csv).toContain("Котёл редактора");
    expect(csv).toContain("1111");
  });
});
